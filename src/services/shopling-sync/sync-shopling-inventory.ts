import "server-only";

import { getKstTodayDate } from "@/lib/date/kst-today";
import { prisma } from "@/lib/db";
import { buildShoplingRequestXml } from "@/lib/shopling/build-request-xml";
import {
  buildShoplingSyncChunk,
  SHOPLING_SYNC_EMPTY_STOP,
  SHOPLING_SYNC_MAX_CHUNKS,
} from "@/lib/shopling/chunk-date-ranges";
import {
  SHOPLING_PROD_FIELDS_SYNC,
  SHOPLING_PROD_GATHER_URL,
} from "@/lib/shopling/constants";
import { formatYyyyMmDd } from "@/lib/shopling/format-yyyymmdd";
import { postShoplingApi } from "@/lib/shopling/post-shopling-api";
import {
  countGoodsInfoBlocks,
  parseShoplingProductsFromXml,
  type ParsedShoplingInventoryRow,
} from "@/lib/shopling/parse-product-rows";
import { extractShoplingApiError } from "@/lib/shopling/parse-response-xml";
import { SHOPLING_INVENTORY_TABLE } from "@/lib/shopling/target";
import { getShoplingApiConfigSecret } from "@/services/shopling-api-config/get-shopling-api-config-secret";
import type {
  ShoplingSyncChunkResult,
  ShoplingSyncRunResult,
  ShoplingSyncServiceResult,
  ShoplingSyncStoppedReason,
} from "@/services/shopling-sync/types";

// 배치당 행 수. 행당 컬럼 18개 → 2000행 = 36,000 파라미터로 Postgres 상한(65535)
// 아래이며, 배치를 키워 Supabase 왕복 횟수를 줄여 적재를 빠르게 한다.
const CREATE_MANY_BATCH_SIZE = 2000;
const INGEST_TX_BASE_MS = 30_000;
const INGEST_TX_PER_BATCH_MS = 15_000;
const INGEST_TX_MAX_MS = 240_000;
const INGEST_TX_MAX_WAIT_MS = 10_000;

function computeIngestTransactionTimeoutMs(rowCount: number): number {
  const batches = Math.max(1, Math.ceil(rowCount / CREATE_MANY_BATCH_SIZE));

  return Math.min(
    INGEST_TX_BASE_MS + batches * INGEST_TX_PER_BATCH_MS,
    INGEST_TX_MAX_MS,
  );
}

type SyncShoplingInventoryInput = {
  uploadedById: string;
};

function dedupeKey(row: ParsedShoplingInventoryRow): string {
  return `${row.goodsKey}|${row.barcode}`;
}

async function fetchShoplingChunkXml(
  config: { loginId: string; companyId: string; apiAuthKey: string },
  startDt: string,
  endDt: string,
): Promise<{ ok: true; body: string } | { ok: false; error: string }> {
  const requestXml = buildShoplingRequestXml({
    loginId: config.loginId,
    companyId: config.companyId,
    apiAuthKey: config.apiAuthKey,
    startDt,
    endDt,
    prodFields: SHOPLING_PROD_FIELDS_SYNC,
  });

  let responseBody: string;
  let httpStatus: number;

  try {
    const response = await postShoplingApi(
      SHOPLING_PROD_GATHER_URL,
      requestXml,
    );
    httpStatus = response.status;
    responseBody = response.body;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "샵플링 API 호출에 실패했습니다.";

    return { ok: false, error: message };
  }

  if (httpStatus < 200 || httpStatus >= 300) {
    const apiError = extractShoplingApiError(responseBody);

    return {
      ok: false,
      error:
        apiError ??
        `샵플링 API 요청에 실패했습니다. (HTTP ${httpStatus})`,
    };
  }

  const apiError = extractShoplingApiError(responseBody);

  if (apiError) {
    return { ok: false, error: apiError };
  }

  return { ok: true, body: responseBody };
}

export async function syncShoplingInventory(
  input: SyncShoplingInventoryInput,
): Promise<ShoplingSyncServiceResult<ShoplingSyncRunResult>> {
  const configResult = await getShoplingApiConfigSecret();

  if (!configResult.ok) {
    return configResult;
  }

  // 시간 계측: 300s 초과(504)의 병목이 fetch인지 DB 적재인지 로그로 특정한다.
  const startedAt = Date.now();
  const elapsedMs = () => Date.now() - startedAt;

  const today = getKstTodayDate();
  const dedupeMap = new Map<string, ParsedShoplingInventoryRow>();
  const chunkResults: ShoplingSyncChunkResult[] = [];
  let consecutiveEmpty = 0;
  let fetchedProductCount = 0;
  let stoppedReason: ShoplingSyncStoppedReason = "max_chunks";

  // 샵플링 API가 동시 요청을 제대로 처리하지 못해(병렬 호출 시 첫 배치가 응답 없이
  // 멈춤) 청크는 순차로 호출한다. 청크별 소요 시간을 로그로 남겨 병목을 계측한다.
  for (
    let chunkIndex = 0;
    chunkIndex < SHOPLING_SYNC_MAX_CHUNKS;
    chunkIndex++
  ) {
    const chunk = buildShoplingSyncChunk(today, chunkIndex);
    const chunkStartedAt = Date.now();
    const fetchResult = await fetchShoplingChunkXml(
      configResult.data,
      chunk.startDt,
      chunk.endDt,
    );

    if (!fetchResult.ok) {
      return { ok: false, error: fetchResult.error };
    }

    const productCount = countGoodsInfoBlocks(fetchResult.body);
    fetchedProductCount += productCount;
    console.log(
      `[shopling-sync-timing] chunk ${chunkIndex} (${chunk.startDt}~${chunk.endDt}) fetched ${productCount} in ${Date.now() - chunkStartedAt}ms (elapsed ${elapsedMs()}ms, rows ${dedupeMap.size})`,
    );

    if (productCount === 0) {
      consecutiveEmpty++;
      chunkResults.push({
        chunkIndex,
        startDt: chunk.startDt,
        endDt: chunk.endDt,
        productCount: 0,
        rowsMerged: 0,
      });

      if (consecutiveEmpty >= SHOPLING_SYNC_EMPTY_STOP) {
        stoppedReason = "empty_streak";
        break;
      }

      continue;
    }

    consecutiveEmpty = 0;
    const parsedRows = parseShoplingProductsFromXml(fetchResult.body);
    let rowsMerged = 0;

    for (const row of parsedRows) {
      const key = dedupeKey(row);

      if (!dedupeMap.has(key)) {
        dedupeMap.set(key, row);
        rowsMerged++;
      }
    }

    chunkResults.push({
      chunkIndex,
      startDt: chunk.startDt,
      endDt: chunk.endDt,
      productCount,
      rowsMerged,
    });
  }

  const rows = [...dedupeMap.values()];
  const snapshotDate = today;
  const oldestStartDt =
    chunkResults[chunkResults.length - 1]?.startDt ??
    buildShoplingSyncChunk(today, 0).startDt;
  const newestEndDt = formatYyyyMmDd(today);

  const txTimeout = computeIngestTransactionTimeoutMs(rows.length);

  console.log(
    `[shopling-sync-timing] fetch phase DONE @ ${elapsedMs()}ms — ${rows.length} rows to insert, ${chunkResults.length} chunks. DB tx start (timeout ${txTimeout}ms)`,
  );
  const dbStartedAt = Date.now();

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.shoplingInventory.deleteMany({
          where: { snapshotDate },
        });

        const ingestionLog = await tx.ingestionLog.create({
          data: {
            tableName: SHOPLING_INVENTORY_TABLE,
            snapshotDate,
            operation: "reload",
            rowCount: rows.length,
            uploadedById: input.uploadedById,
            sourceFile: "shopling-api-sync",
          },
        });

        for (
          let offset = 0;
          offset < rows.length;
          offset += CREATE_MANY_BATCH_SIZE
        ) {
          const batch = rows.slice(offset, offset + CREATE_MANY_BATCH_SIZE);

          await tx.shoplingInventory.createMany({
            data: batch.map((row) => ({
              ingestionId: ingestionLog.id,
              goodsKey: row.goodsKey,
              ptnGoodsCd: row.ptnGoodsCd,
              productName: row.productName,
              saleStatus: row.saleStatus,
              goodsTp: row.goodsTp,
              barcode: row.barcode,
              optId: row.optId,
              optionTitle: row.optionTitle,
              optionValue: row.optionValue,
              availableStock: row.availableStock,
              realStock: row.realStock,
              optVrtlQty: row.optVrtlQty,
              optPrice: row.optPrice,
              optSupplyPrice: row.optSupplyPrice,
              optStatus: row.optStatus,
              location: row.location,
              snapshotDate,
            })),
          });
        }
      },
      {
        maxWait: INGEST_TX_MAX_WAIT_MS,
        timeout: txTimeout,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "샵플링 재고 데이터 적재에 실패했습니다.";

    return { ok: false, error: message };
  }

  console.log(
    `[shopling-sync-timing] DB insert DONE in ${Date.now() - dbStartedAt}ms (total ${elapsedMs()}ms, ${rows.length} rows)`,
  );

  return {
    ok: true,
    data: {
      snapshotDate: formatYyyyMmDd(snapshotDate),
      oldestStartDt,
      newestEndDt,
      chunksProcessed: chunkResults.length,
      stoppedReason,
      fetchedProductCount,
      rowCount: rows.length,
      chunks: chunkResults,
    },
  };
}

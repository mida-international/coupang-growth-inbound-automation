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

const CREATE_MANY_BATCH_SIZE = 1000;
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

  const today = getKstTodayDate();
  const dedupeMap = new Map<string, ParsedShoplingInventoryRow>();
  const chunkResults: ShoplingSyncChunkResult[] = [];
  let consecutiveEmpty = 0;
  let fetchedProductCount = 0;
  let stoppedReason: ShoplingSyncStoppedReason = "max_chunks";

  for (let chunkIndex = 0; chunkIndex < SHOPLING_SYNC_MAX_CHUNKS; chunkIndex++) {
    const chunk = buildShoplingSyncChunk(today, chunkIndex);
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

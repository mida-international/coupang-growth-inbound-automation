import "server-only";

import { getKstTodayDate } from "@/lib/date/kst-today";
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
import {
  parseShoplingPackageMappingsFromXml,
  type ParsedShoplingPackageMappingRow,
} from "@/lib/shopling/parse-package-mappings";
import {
  countGoodsInfoBlocks,
  parseShoplingProductsFromXml,
  type ParsedShoplingInventoryRow,
} from "@/lib/shopling/parse-product-rows";
import { extractShoplingApiError } from "@/lib/shopling/parse-response-xml";
import { postShoplingApi } from "@/lib/shopling/post-shopling-api";
import { getShoplingApiConfigSecret } from "@/services/shopling-api-config/get-shopling-api-config-secret";
import type {
  FetchShoplingPackageSourceResult,
  ShoplingPackageMappingChunkResult,
  ShoplingPackageMappingServiceResult,
  ShoplingPackageMappingStoppedReason,
} from "@/services/shopling-package-mapping/types";

function productDedupeKey(row: ParsedShoplingInventoryRow): string {
  return `${row.goodsKey}|${row.barcode}`;
}

function packageMappingDedupeKey(row: ParsedShoplingPackageMappingRow): string {
  return `${row.packageOptId}|${row.singleOptId}`;
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

export async function fetchShoplingPackageSource(): Promise<
  ShoplingPackageMappingServiceResult<FetchShoplingPackageSourceResult>
> {
  const configResult = await getShoplingApiConfigSecret();

  if (!configResult.ok) {
    return configResult;
  }

  const today = getKstTodayDate();
  const productDedupeMap = new Map<string, ParsedShoplingInventoryRow>();
  const mappingDedupeMap = new Map<string, ParsedShoplingPackageMappingRow>();
  const chunkResults: ShoplingPackageMappingChunkResult[] = [];
  let consecutiveEmpty = 0;
  let fetchedProductCount = 0;
  let stoppedReason: ShoplingPackageMappingStoppedReason = "max_chunks";

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
        productsMerged: 0,
        mappingsMerged: 0,
      });

      if (consecutiveEmpty >= SHOPLING_SYNC_EMPTY_STOP) {
        stoppedReason = "empty_streak";
        break;
      }

      continue;
    }

    consecutiveEmpty = 0;
    const parsedProducts = parseShoplingProductsFromXml(fetchResult.body);
    const parsedMappings = parseShoplingPackageMappingsFromXml(fetchResult.body);
    let productsMerged = 0;
    let mappingsMerged = 0;

    for (const row of parsedProducts) {
      const key = productDedupeKey(row);

      if (!productDedupeMap.has(key)) {
        productDedupeMap.set(key, row);
        productsMerged++;
      }
    }

    for (const row of parsedMappings) {
      const key = packageMappingDedupeKey(row);

      if (!mappingDedupeMap.has(key)) {
        mappingDedupeMap.set(key, row);
        mappingsMerged++;
      }
    }

    chunkResults.push({
      chunkIndex,
      startDt: chunk.startDt,
      endDt: chunk.endDt,
      productCount,
      productsMerged,
      mappingsMerged,
    });
  }

  const products = [...productDedupeMap.values()];
  const packageMappings = [...mappingDedupeMap.values()];
  const oldestStartDt =
    chunkResults[chunkResults.length - 1]?.startDt ??
    buildShoplingSyncChunk(today, 0).startDt;
  const newestEndDt = formatYyyyMmDd(today);

  return {
    ok: true,
    data: {
      oldestStartDt,
      newestEndDt,
      chunksProcessed: chunkResults.length,
      stoppedReason,
      fetchedProductCount,
      productRowCount: products.length,
      packageMappingRowCount: packageMappings.length,
      products,
      packageMappings,
      chunks: chunkResults,
    },
  };
}

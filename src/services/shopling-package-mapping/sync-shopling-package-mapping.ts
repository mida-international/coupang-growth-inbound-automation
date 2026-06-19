import "server-only";

import type { ParsedShoplingPackageMappingRow } from "@/lib/shopling/parse-package-mappings";
import type { ParsedShoplingInventoryRow } from "@/lib/shopling/parse-product-rows";
import { prisma } from "@/lib/db";
import { fetchShoplingPackageSource } from "@/services/shopling-package-mapping/fetch-shopling-package-source";
import type {
  ShoplingPackageMappingServiceResult,
  SyncShoplingPackageMappingResult,
  SyncShoplingPackageMappingStats,
} from "@/services/shopling-package-mapping/types";

const CREATE_MANY_BATCH_SIZE = 1000;
const RELOAD_TX_BASE_MS = 30_000;
const RELOAD_TX_PER_BATCH_MS = 15_000;
const RELOAD_TX_MAX_MS = 240_000;
const RELOAD_TX_MAX_WAIT_MS = 10_000;

function computeReloadTransactionTimeoutMs(rowCount: number): number {
  const batches = Math.max(1, Math.ceil(rowCount / CREATE_MANY_BATCH_SIZE));

  return Math.min(
    RELOAD_TX_BASE_MS + batches * RELOAD_TX_PER_BATCH_MS,
    RELOAD_TX_MAX_MS,
  );
}

type OptIdInfo = {
  barcode: string;
  goodsKey: string;
  ptnGoodsCd: string;
};

type UpsertPackageMappingRow = {
  packageBarcode: string | null;
  packageGoodsKey: string;
  packageOptId: string;
  packagePtnGoodsCd: string | null;
  packageOptValue: string | null;
  singleBarcode: string | null;
  singleGoodsKey: string | null;
  singleOptId: string;
  singleOptValue: string | null;
  singlePtnGoodsCd: string | null;
  mapCnt: number;
};

function mappingPairKey(packageOptId: string, singleOptId: string): string {
  return `${packageOptId}__${singleOptId}`;
}

function registerOptIdInfo(
  map: Map<string, OptIdInfo>,
  optId: string | null | undefined,
  info: OptIdInfo,
): void {
  if (!optId) {
    return;
  }

  map.set(optId, info);
}

function buildOptIdLookupFromProducts(
  products: ParsedShoplingInventoryRow[],
): Map<string, OptIdInfo> {
  const map = new Map<string, OptIdInfo>();

  for (const product of products) {
    registerOptIdInfo(map, product.optId, {
      barcode: product.barcode || "",
      goodsKey: product.goodsKey || "",
      ptnGoodsCd: product.ptnGoodsCd || "",
    });
  }

  return map;
}

function collectNeededOptIds(
  packageMappings: ParsedShoplingPackageMappingRow[],
  optToInfo: Map<string, OptIdInfo>,
): string[] {
  const needed = new Set<string>();

  for (const mapping of packageMappings) {
    if (!optToInfo.has(mapping.packageOptId)) {
      needed.add(mapping.packageOptId);
    }

    if (!optToInfo.has(mapping.singleOptId)) {
      needed.add(mapping.singleOptId);
    }
  }

  return [...needed];
}

async function supplementOptIdLookupFromInventory(
  optToInfo: Map<string, OptIdInfo>,
  neededOptIds: string[],
): Promise<void> {
  if (neededOptIds.length === 0) {
    return;
  }

  const { _max } = await prisma.shoplingInventory.aggregate({
    _max: { snapshotDate: true },
  });

  const maxSnapshotDate = _max.snapshotDate;

  if (!maxSnapshotDate) {
    return;
  }

  const invRows = await prisma.shoplingInventory.findMany({
    where: {
      snapshotDate: maxSnapshotDate,
      optId: { in: neededOptIds },
    },
    select: {
      optId: true,
      barcode: true,
      goodsKey: true,
      ptnGoodsCd: true,
    },
  });

  for (const row of invRows) {
    if (!row.optId || optToInfo.has(row.optId)) {
      continue;
    }

    optToInfo.set(row.optId, {
      barcode: row.barcode || "",
      goodsKey: row.goodsKey || "",
      ptnGoodsCd: row.ptnGoodsCd || "",
    });
  }
}

function buildUpsertRow(
  mapping: ParsedShoplingPackageMappingRow,
  optToInfo: Map<string, OptIdInfo>,
  stats: SyncShoplingPackageMappingStats,
): UpsertPackageMappingRow {
  const packageInfo = optToInfo.get(mapping.packageOptId);
  const singleInfo = optToInfo.get(mapping.singleOptId);

  const packageBarcode =
    packageInfo?.barcode || mapping.packageBarcode || null;
  const singleBarcode = singleInfo?.barcode || null;
  const singleGoodsKey = singleInfo?.goodsKey || null;
  const singlePtnGoodsCd = singleInfo?.ptnGoodsCd || null;

  if (!packageBarcode) {
    stats.missing_package_barcode++;
  }

  if (!singleBarcode) {
    stats.missing_single_barcode++;
  }

  if (!singlePtnGoodsCd) {
    stats.missing_single_ptn_goods_cd++;
  }

  return {
    packageBarcode,
    packageGoodsKey: mapping.packageGoodsKey,
    packageOptId: mapping.packageOptId,
    packagePtnGoodsCd: mapping.packagePtnGoodsCd,
    packageOptValue: mapping.packageOptValue,
    singleBarcode,
    singleGoodsKey,
    singleOptId: mapping.singleOptId,
    singleOptValue: mapping.singleOptValue,
    singlePtnGoodsCd,
    mapCnt: mapping.mapCnt,
  };
}

async function reloadPackageMappingRows(
  rows: UpsertPackageMappingRow[],
  stats: SyncShoplingPackageMappingStats,
): Promise<string | null> {
  const txTimeout = computeReloadTransactionTimeoutMs(rows.length);

  try {
    await prisma.$transaction(
      async (tx) => {
        const deleteResult = await tx.shoplingPackageMapping.deleteMany({
          where: { manuallyEdited: false },
        });

        stats.deleted = deleteResult.count;

        for (
          let offset = 0;
          offset < rows.length;
          offset += CREATE_MANY_BATCH_SIZE
        ) {
          const batch = rows.slice(offset, offset + CREATE_MANY_BATCH_SIZE);

          await tx.shoplingPackageMapping.createMany({
            data: batch.map((row) => ({
              ...row,
              manuallyEdited: false,
            })),
          });
        }
      },
      {
        maxWait: RELOAD_TX_MAX_WAIT_MS,
        timeout: txTimeout,
      },
    );

    stats.upserted = rows.length;
    return null;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "패키지 매핑 적재에 실패했습니다.";
  }
}

export async function syncShoplingPackageMapping(): Promise<
  ShoplingPackageMappingServiceResult<SyncShoplingPackageMappingResult>
> {
  const fetchResult = await fetchShoplingPackageSource();

  if (!fetchResult.ok) {
    return fetchResult;
  }

  const { products, packageMappings } = fetchResult.data;
  const stats: SyncShoplingPackageMappingStats = {
    total: packageMappings.length,
    upserted: 0,
    skipped_manual: 0,
    missing_single_barcode: 0,
    missing_single_ptn_goods_cd: 0,
    missing_package_barcode: 0,
    duplicates_removed: 0,
    deleted: 0,
    prune_skipped: true,
    prune_protected_manual: 0,
  };

  const optToInfo = buildOptIdLookupFromProducts(products);
  const neededOptIds = collectNeededOptIds(packageMappings, optToInfo);

  await supplementOptIdLookupFromInventory(optToInfo, neededOptIds);

  const manualRows = await prisma.shoplingPackageMapping.findMany({
    where: { manuallyEdited: true },
    select: { packageOptId: true, singleOptId: true },
  });

  const manualKeys = new Set(
    manualRows.map((row) => mappingPairKey(row.packageOptId, row.singleOptId)),
  );

  stats.prune_protected_manual = manualRows.length;

  const upsertRows: UpsertPackageMappingRow[] = [];

  for (const mapping of packageMappings) {
    if (manualKeys.has(mappingPairKey(mapping.packageOptId, mapping.singleOptId))) {
      stats.skipped_manual++;
      continue;
    }

    upsertRows.push(buildUpsertRow(mapping, optToInfo, stats));
  }

  const dedupMap = new Map<string, UpsertPackageMappingRow>();

  for (const row of upsertRows) {
    dedupMap.set(mappingPairKey(row.packageOptId, row.singleOptId), row);
  }

  const dedupedRows = [...dedupMap.values()];
  stats.duplicates_removed = upsertRows.length - dedupedRows.length;

  const reloadError = await reloadPackageMappingRows(dedupedRows, stats);

  if (reloadError) {
    return {
      ok: false,
      error: reloadError,
    };
  }

  return {
    ok: true,
    data: { stats },
  };
}

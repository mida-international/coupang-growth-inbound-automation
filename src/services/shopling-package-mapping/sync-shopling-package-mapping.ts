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

const UPSERT_BATCH_SIZE = 500;
const PRUNE_PAGE_SIZE = 1000;
const PRUNE_DELETE_CHUNK_SIZE = 200;

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

async function upsertPackageMappingRows(
  rows: UpsertPackageMappingRow[],
  stats: SyncShoplingPackageMappingStats,
  errors: string[],
): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(offset, offset + UPSERT_BATCH_SIZE);

    try {
      await prisma.$transaction(
        batch.map((row) =>
          prisma.shoplingPackageMapping.upsert({
            where: {
              packageOptId_singleOptId: {
                packageOptId: row.packageOptId,
                singleOptId: row.singleOptId,
              },
            },
            create: {
              ...row,
              manuallyEdited: false,
            },
            update: {
              packageBarcode: row.packageBarcode,
              packageGoodsKey: row.packageGoodsKey,
              packagePtnGoodsCd: row.packagePtnGoodsCd,
              packageOptValue: row.packageOptValue,
              singleBarcode: row.singleBarcode,
              singleGoodsKey: row.singleGoodsKey,
              singleOptValue: row.singleOptValue,
              singlePtnGoodsCd: row.singlePtnGoodsCd,
              mapCnt: row.mapCnt,
            },
          }),
        ),
      );

      stats.upserted += batch.length;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "패키지 매핑 upsert에 실패했습니다.";

      errors.push(message);
    }
  }
}

async function pruneStalePackageMappings(
  packageMappings: ParsedShoplingPackageMappingRow[],
  stats: SyncShoplingPackageMappingStats,
  errors: string[],
): Promise<void> {
  const responseKeys = new Set(
    packageMappings.map((m) => mappingPairKey(m.packageOptId, m.singleOptId)),
  );

  const safeToPrune =
    packageMappings.length > 0 && errors.length === 0 && responseKeys.size > 0;

  if (!safeToPrune) {
    stats.prune_skipped = true;
    return;
  }

  const toDelete: string[] = [];
  let skip = 0;

  while (true) {
    const page = await prisma.shoplingPackageMapping.findMany({
      skip,
      take: PRUNE_PAGE_SIZE,
      orderBy: [{ packageOptId: "asc" }, { singleOptId: "asc" }],
      select: {
        id: true,
        packageOptId: true,
        singleOptId: true,
        manuallyEdited: true,
      },
    });

    if (page.length === 0) {
      break;
    }

    for (const row of page) {
      const key = mappingPairKey(row.packageOptId, row.singleOptId);

      if (responseKeys.has(key)) {
        continue;
      }

      if (row.manuallyEdited) {
        stats.prune_protected_manual++;
        continue;
      }

      toDelete.push(row.id);
    }

    if (page.length < PRUNE_PAGE_SIZE) {
      break;
    }

    skip += PRUNE_PAGE_SIZE;
  }

  for (let offset = 0; offset < toDelete.length; offset += PRUNE_DELETE_CHUNK_SIZE) {
    const chunk = toDelete.slice(offset, offset + PRUNE_DELETE_CHUNK_SIZE);

    try {
      const result = await prisma.shoplingPackageMapping.deleteMany({
        where: { id: { in: chunk } },
      });

      stats.deleted += result.count;
    } catch (error) {
      const message =
        error instanceof Error
          ? `prune: 삭제 실패: ${error.message}`
          : "prune: 삭제에 실패했습니다.";

      errors.push(message);
      break;
    }
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
  const errors: string[] = [];
  const stats: SyncShoplingPackageMappingStats = {
    total: packageMappings.length,
    upserted: 0,
    skipped_manual: 0,
    missing_single_barcode: 0,
    missing_single_ptn_goods_cd: 0,
    missing_package_barcode: 0,
    duplicates_removed: 0,
    deleted: 0,
    prune_skipped: false,
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

  if (dedupedRows.length > 0) {
    await upsertPackageMappingRows(dedupedRows, stats, errors);
  }

  await pruneStalePackageMappings(packageMappings, stats, errors);

  if (errors.length > 0) {
    return {
      ok: false,
      error: errors.join("; "),
    };
  }

  return {
    ok: true,
    data: { stats },
  };
}

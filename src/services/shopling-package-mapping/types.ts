import type { ParsedShoplingPackageMappingRow } from "@/lib/shopling/parse-package-mappings";
import type { ParsedShoplingInventoryRow } from "@/lib/shopling/parse-product-rows";

export type ShoplingPackageMappingServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ShoplingPackageMappingStoppedReason =
  | "empty_streak"
  | "max_chunks";

export type ShoplingPackageMappingChunkResult = {
  chunkIndex: number;
  startDt: string;
  endDt: string;
  productCount: number;
  productsMerged: number;
  mappingsMerged: number;
};

export type FetchShoplingPackageSourceResult = {
  oldestStartDt: string;
  newestEndDt: string;
  chunksProcessed: number;
  stoppedReason: ShoplingPackageMappingStoppedReason;
  fetchedProductCount: number;
  productRowCount: number;
  packageMappingRowCount: number;
  products: ParsedShoplingInventoryRow[];
  packageMappings: ParsedShoplingPackageMappingRow[];
  chunks: ShoplingPackageMappingChunkResult[];
};

export type SyncShoplingPackageMappingStats = {
  total: number;
  upserted: number;
  skipped_manual: number;
  missing_single_barcode: number;
  missing_single_ptn_goods_cd: number;
  missing_package_barcode: number;
  duplicates_removed: number;
  deleted: number;
  prune_skipped: boolean;
  prune_protected_manual: number;
};

export type SyncShoplingPackageMappingResult = {
  stats: SyncShoplingPackageMappingStats;
  errors?: string[];
};

export type ShoplingPackageMappingRowView = {
  id: string;
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
  manuallyEdited: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListShoplingPackageMappingResult = {
  totalCount: number;
  rows: ShoplingPackageMappingRowView[];
};

export const SHOPLING_PACKAGE_MAPPING_PAGE_SIZE_OPTIONS = [
  25, 50, 100, 200,
] as const;

export const SHOPLING_PACKAGE_MAPPING_DEFAULT_PAGE_SIZE = 50;

export function normalizeShoplingPackageMappingPageSize(
  value?: number,
): number {
  if (
    value !== undefined &&
    SHOPLING_PACKAGE_MAPPING_PAGE_SIZE_OPTIONS.includes(
      value as (typeof SHOPLING_PACKAGE_MAPPING_PAGE_SIZE_OPTIONS)[number],
    )
  ) {
    return value;
  }

  return SHOPLING_PACKAGE_MAPPING_DEFAULT_PAGE_SIZE;
}

export type CreateShoplingPackageMappingBody = {
  packageOptId: string;
  singleOptId: string;
  packageGoodsKey: string;
  mapCnt: number;
  packageBarcode?: string | null;
  packagePtnGoodsCd?: string | null;
  packageOptValue?: string | null;
  singleBarcode?: string | null;
  singleGoodsKey?: string | null;
  singleOptValue?: string | null;
  singlePtnGoodsCd?: string | null;
};

export type UpdateShoplingPackageMappingBody = {
  packageBarcode?: string | null;
  packagePtnGoodsCd?: string | null;
  packageOptValue?: string | null;
  singleBarcode?: string | null;
  singleGoodsKey?: string | null;
  singleOptValue?: string | null;
  singlePtnGoodsCd?: string | null;
  mapCnt?: number;
};

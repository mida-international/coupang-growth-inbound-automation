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

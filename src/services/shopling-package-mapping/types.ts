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

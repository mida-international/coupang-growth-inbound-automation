export type WarehouseInboundListRow = {
  location: string | null;
  registeredProductName: string | null;
  optionName: string | null;
  productBarcode: string | null;
  growthInboundRecommend: number;
};

export type WarehouseInboundListSnapshotDates = {
  template: string | null;
  shopling: string | null;
};

export type ListWarehouseInboundRowsResult = {
  snapshotDates: WarehouseInboundListSnapshotDates | null;
  rowCount: number;
  rows: WarehouseInboundListRow[];
};

export type { BoxListItem } from "@/lib/excel/parsers/parse-box-inbound-list";

export type BoxListSource = "excel" | "image";

export type FilterInboundTemplateStats = {
  source: BoxListSource;
  inputTotal: number;
  inputWithQty: number;
  inputBarcodes: number;
  matched: number;
  unmatched: string[];
  originalRows: number;
  finalRows: number;
  inputFileSkippedRows: number;
  lowConfidenceRows?: number;
};

export type MatchedInboundTemplateItem = {
  productBarcode: string;
  coupangOptionId: string;
  quantity: number;
};

export type AggregatedInboundRecordItem = {
  productBarcode: string;
  coupangOptionId: string | null;
  quantity: number;
};

export type RecordCoupangInboundInput = {
  coupangSellerAccountId: string;
  recordedById: string;
  templateBuffer: Buffer;
  boxListInput: import("@/lib/excel/generators/filter-inbound-template").BoxListInput;
};

export type RecordCoupangInboundResult = {
  batchId: string;
  recordedCount: number;
  matchedBarcodeCount: number;
};

export type GenerateCoupangInboundTemplateResult = {
  buffer: Buffer;
  stats: FilterInboundTemplateStats;
  matchedItems: MatchedInboundTemplateItem[];
};

export type LatestInboundTemplateFileMeta = {
  exists: boolean;
  updatedAt: string | null;
  fileName: string | null;
};

export type LatestInboundTemplateFile = LatestInboundTemplateFileMeta & {
  buffer: Buffer;
};

export type NormalizeOutboundBoxItemsResult = {
  qtyByBarcode: Map<string, number>;
  inputTotal: number;
  inputWithQty: number;
  inputBarcodes: number;
  skippedDummy: number;
  skippedRows: number;
};

export type OutboundDeductRow = {
  barcode: string;
  deductQty: number;
};

export type DecomposeOutboundStats = {
  inputBarcodes: number;
  outputRows: number;
  packagesDecomposed: number;
  skippedUnmappedPackages: string[];
  skippedDummy: number;
};

export type GenerateShoplingOutboundTemplateResult = {
  buffer: Buffer;
  stats: DecomposeOutboundStats;
  rows: OutboundDeductRow[];
};

export type ShoplingInboundTemplateStats = {
  inputRows: number;
  outputRows: number;
  skippedRows: number;
  skippedDummy: number;
  unmapped: Array<{ ptnGoodsCd: string; optionValue: string }>;
  ambiguous: Array<{ ptnGoodsCd: string; optionValue: string }>;
};

export type GenerateShoplingInboundTemplateResult = {
  buffer: Buffer;
  stats: ShoplingInboundTemplateStats;
  rows: OutboundDeductRow[];
};

export type ShoplingInboundOriginalStats = {
  totalAttempted: number;
  matched: number;
  unmapped: number;
  ambiguous: number;
  skippedDummy: number;
};

export type GenerateShoplingInboundOriginalResult = {
  buffer: Buffer;
  bookType: string;
  stats: ShoplingInboundOriginalStats;
};

export type RecordShoplingInboundDeliverableInput = {
  inboundListBuffer: Buffer;
  sourceFileName?: string | null;
  recordedById: string;
};

export type RecordShoplingInboundDeliverableResult = {
  deliverableId: string;
  recordedCount: number;
};

export type ShoplingInboundDeliverableItemView = {
  barcode: string;
  quantity: number;
};

export type ShoplingInboundDeliverableListItem = {
  id: string;
  outputFileName: string;
  sourceFileName: string | null;
  recordedAt: string;
  recordedByName: string | null;
  barcodeCount: number;
  totalQuantity: number;
  items: ShoplingInboundDeliverableItemView[];
};

export type ListShoplingInboundDeliverablesResult = {
  rowCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  rows: ShoplingInboundDeliverableListItem[];
};

export const SHOPLING_INBOUND_DELIVERABLE_PAGE_SIZE_DEFAULT = 20;
export const SHOPLING_INBOUND_DELIVERABLE_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

export function normalizeShoplingInboundDeliverablePageSize(value?: number): number {
  if (!value || Number.isNaN(value)) {
    return SHOPLING_INBOUND_DELIVERABLE_PAGE_SIZE_DEFAULT;
  }

  return SHOPLING_INBOUND_DELIVERABLE_PAGE_SIZE_OPTIONS.includes(
    value as (typeof SHOPLING_INBOUND_DELIVERABLE_PAGE_SIZE_OPTIONS)[number],
  )
    ? value
    : SHOPLING_INBOUND_DELIVERABLE_PAGE_SIZE_DEFAULT;
}

export type ShoplingInboundDeliverableFile = {
  outputFileName: string;
  buffer: Buffer;
};

export type ShoplingInboundDeliverableServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

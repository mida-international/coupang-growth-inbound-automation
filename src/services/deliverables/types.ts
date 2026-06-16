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

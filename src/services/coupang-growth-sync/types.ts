import type { ExcelIngestionTargetId } from "@/lib/excel/types";

export type IngestInboundTemplateInput = {
  buffer: Buffer;
  sourceFile: string;
  coupangSellerAccountId: string;
  uploadedById: string;
};

export type IngestInboundTemplateResult = {
  ingestionId: bigint;
  rowCount: number;
  skippedRowCount: number;
};

export type IngestInventoryHealthInput = {
  buffer: Buffer;
  sourceFile: string;
  coupangSellerAccountId: string;
  uploadedById: string;
};

export type IngestInventoryHealthResult = {
  ingestionId: bigint;
  rowCount: number;
  skippedRowCount: number;
};

export type ExcelUploadFileResult = {
  fileName: string;
  ok: boolean;
  targetId?: ExcelIngestionTargetId;
  rowCount?: number;
  error?: string;
};

export type ExcelUploadResponse = {
  results: ExcelUploadFileResult[];
};

export type DetectExcelFileResult = {
  fileName: string;
  targetId: ExcelIngestionTargetId | null;
};

export type DetectExcelResponse = {
  results: DetectExcelFileResult[];
};

export type IngestServiceResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

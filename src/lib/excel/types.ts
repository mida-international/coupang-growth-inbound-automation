export const EXCEL_INGESTION_TARGET_IDS = [
  "coupang_growth_inbound_template",
  "coupang_growth_inventory_health",
] as const;

export type ExcelIngestionTargetId =
  (typeof EXCEL_INGESTION_TARGET_IDS)[number];

export type ExcelIngestionTarget = {
  id: ExcelIngestionTargetId;
  tableName: string;
  label: string;
  requiredHeaderKeywords: readonly string[];
  filenamePatterns?: readonly RegExp[];
};

export type ExcelTargetDetectionResult =
  | { ok: true; targetId: ExcelIngestionTargetId }
  | { ok: false; reason: "unknown" | "not_allowed" };

export type SelectedExcelFile = {
  id: string;
  file: File;
  targetId: ExcelIngestionTargetId | null;
  detecting?: boolean;
};

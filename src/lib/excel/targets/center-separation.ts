import type { ExcelIngestionTarget } from "@/lib/excel/types";

export const CENTER_SEPARATION_EXCEL_HEADERS = ["바코드"] as const;

export type CenterSeparationExcelHeader =
  (typeof CENTER_SEPARATION_EXCEL_HEADERS)[number];

export const centerSeparationBarcodeTarget: ExcelIngestionTarget = {
  id: "center_separation_barcode",
  tableName: "coupang_center_separation",
  label: "센터분리 바코드 업로드",
  requiredHeaderKeywords: ["바코드"],
  filenamePatterns: [/센터분리/i, /center.?separation/i],
};

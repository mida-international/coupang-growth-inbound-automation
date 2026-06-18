export const CENTER_SEPARATION_EXCEL_HEADERS = ["바코드"] as const;

export type CenterSeparationExcelHeader =
  (typeof CENTER_SEPARATION_EXCEL_HEADERS)[number];

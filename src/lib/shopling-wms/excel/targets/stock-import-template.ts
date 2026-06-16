import path from "path";

export const STOCK_IMPORT_TEMPLATE_REL_PATH =
  "public/templates/stockIpReg.xlsx";

export const STOCK_IMPORT_LAYOUT = {
  sheetName: "Sheet1",
  dataStartRow: 3,
  barcodeCol: 1,
  productCodeCol: 2,
  optionCodeCol: 3,
  qtyCol: 4,
  rowHeight: 20.25,
} as const;

export function getStockImportTemplatePath(): string {
  return path.join(process.cwd(), STOCK_IMPORT_TEMPLATE_REL_PATH);
}

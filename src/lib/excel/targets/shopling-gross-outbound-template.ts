import path from "path";

export const SHOPLING_OUTBOUND_TEMPLATE_REL_PATH =
  "public/templates/shopling-gross-outbound.xlsx";

export const SHOPLING_OUTBOUND_LAYOUT = {
  sheetName: "Sheet1",
  headerRowCount: 2,
  dataStartRow: 3,
  barcodeCol: 1,
  deductQtyCol: 4,
} as const;

export const SHOPLING_DUMMY_BARCODE = "12345678910";

export function getShoplingOutboundTemplatePath(): string {
  return path.join(process.cwd(), SHOPLING_OUTBOUND_TEMPLATE_REL_PATH);
}

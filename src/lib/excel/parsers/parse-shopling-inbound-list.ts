import * as XLSX from "xlsx";

export type ShoplingInboundListItem = {
  ptnGoodsCd: string;
  optionValue: string;
  quantity: number;
};

export type ParseShoplingInboundListResult = {
  items: ShoplingInboundListItem[];
  skippedRows: number;
};

const PTN_GOODS_CD_COL = 3;
const OPTION_VALUE_COL = 4;
const QUANTITY_COL = 8;

function readCellValue(
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  colIndex: number,
): string {
  const cell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })];

  if (cell?.v == null) {
    return "";
  }

  return String(cell.v).trim();
}

function parseQuantity(raw: string): number | null {
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw.replace(/,/g, ""), 10);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function parseShoplingInboundList(
  buffer: ArrayBuffer | Buffer,
): ParseShoplingInboundListResult {
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const workbook = XLSX.read(data, { type: "buffer" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet?.["!ref"]) {
    return { items: [], skippedRows: 0 };
  }

  const range = XLSX.utils.decode_range(firstSheet["!ref"]);
  const items: ShoplingInboundListItem[] = [];
  let skippedRows = 0;

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex++) {
    const ptnGoodsCd = readCellValue(firstSheet, rowIndex, PTN_GOODS_CD_COL);
    const optionValue = readCellValue(firstSheet, rowIndex, OPTION_VALUE_COL);
    const quantityRaw = readCellValue(firstSheet, rowIndex, QUANTITY_COL);
    const quantity = parseQuantity(quantityRaw);

    if (!ptnGoodsCd || quantity == null || quantity <= 0) {
      const hasAnyValue = [ptnGoodsCd, optionValue, quantityRaw].some(
        (value) => value.length > 0,
      );

      if (hasAnyValue) {
        skippedRows += 1;
      }

      continue;
    }

    items.push({
      ptnGoodsCd,
      optionValue,
      quantity,
    });
  }

  return {
    items,
    skippedRows,
  };
}

export type NegativeInventoryRow = {
  productCode: string;
  optionCode: string;
  qty: number;
};

export type ParseNegativeInventoryResult = {
  rows: NegativeInventoryRow[];
  empty: boolean;
};

const PRODUCT_COL = 3;
const OPTION_COL = 4;
const STOCK_COL = 22;

function readCellText(
  row: unknown[],
  colIndex: number,
): string {
  const value = row[colIndex];

  if (value == null) {
    return "";
  }

  return String(value).trim();
}

function parseStockQty(raw: string): number | null {
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/,/g, "");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.abs(parsed);
}

export function parseNegativeInventorySheetRows(
  sheetRows: unknown[][],
): ParseNegativeInventoryResult {
  const rows: NegativeInventoryRow[] = [];

  for (let rowIndex = 1; rowIndex < sheetRows.length; rowIndex += 1) {
    const row = sheetRows[rowIndex];

    if (!Array.isArray(row)) {
      continue;
    }

    const productCode = readCellText(row, PRODUCT_COL);
    const optionCode = readCellText(row, OPTION_COL);
    const stockRaw = readCellText(row, STOCK_COL);

    if (!productCode || !stockRaw) {
      continue;
    }

    const qty = parseStockQty(stockRaw);

    if (qty == null || qty <= 0) {
      continue;
    }

    rows.push({
      productCode,
      optionCode,
      qty,
    });
  }

  return {
    rows,
    empty: rows.length === 0,
  };
}

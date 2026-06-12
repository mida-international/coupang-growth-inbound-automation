import { detectExcelTargetFromRows } from "@/lib/excel/detect-target";
import { normalizeHeader } from "@/lib/excel/normalize-header";
import { readExcelRows } from "@/lib/excel/read-workbook";
import {
  inventoryHealthColumnMap,
  coupangGrowthInventoryHealthTarget,
  type InventoryHealthField,
} from "@/lib/excel/targets/coupang-growth-inventory-health";
import {
  parseOptionalBigInt,
  parseOptionalDate,
  parseOptionalInt,
  parseOptionalString,
} from "@/lib/excel/parsers/parse-cell-values";

export type ParsedInventoryHealthRow = {
  inventoryId: bigint | null;
  optionId: bigint | null;
  skuId: bigint | null;
  productName: string | null;
  optionName: string | null;
  offerCondition: string | null;
  orderableQuantity: number | null;
  pendingInbounds: number | null;
  itemWinner: string | null;
  recentSales7days: bigint | null;
  recentSales30days: bigint | null;
  recentSalesQty7days: number | null;
  recentSalesQty30days: number | null;
  recommendedInboundQty: number | null;
  recommendedInboundDate: string | null;
  daysOfCover: string | null;
  monthlyStorageFee: number | null;
  skuAge1_30: number | null;
  skuAge31_45: number | null;
  skuAge46_60: number | null;
  skuAge61_120: number | null;
  skuAge121_180: number | null;
  skuAge181Plus: number | null;
  customerReturns30days: number | null;
  season: string | null;
  productListingDate: Date | null;
};

export type ParseInventoryHealthResult =
  | { ok: true; rows: ParsedInventoryHealthRow[]; skippedRowCount: number }
  | { ok: false; error: string };

type ColumnMapEntry = (typeof inventoryHealthColumnMap)[number];

function matchesHeader(cell: unknown, entry: ColumnMapEntry): boolean {
  const normalized = normalizeHeader(cell);
  const primary = normalizeHeader(entry.headerIncludes);

  if (!normalized.includes(primary)) {
    return false;
  }

  if (
    "headerAlsoIncludes" in entry &&
    entry.headerAlsoIncludes &&
    !normalized.includes(normalizeHeader(entry.headerAlsoIncludes))
  ) {
    return false;
  }

  if (
    "excludeIncludes" in entry &&
    entry.excludeIncludes &&
    normalized.includes(normalizeHeader(entry.excludeIncludes))
  ) {
    return false;
  }

  return true;
}

function forwardFillRow(row: unknown[]): string[] {
  const filled: string[] = [];
  let lastValue = "";

  for (const cell of row) {
    const normalized = normalizeHeader(cell);

    if (normalized) {
      lastValue = normalized;
    }

    filled.push(lastValue);
  }

  return filled;
}

function buildEffectiveHeaders(
  mainRow: unknown[],
  subRow: unknown[] | undefined,
): string[] {
  const filledMain = forwardFillRow(mainRow);
  const columnCount = Math.max(
    filledMain.length,
    Array.isArray(subRow) ? subRow.length : 0,
  );
  const effectiveHeaders: string[] = [];

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const mainPart = filledMain[columnIndex] ?? "";
    const subPart = normalizeHeader(
      Array.isArray(subRow) ? subRow[columnIndex] : null,
    );

    effectiveHeaders.push(
      subPart ? `${mainPart} ${subPart}`.trim() : mainPart,
    );
  }

  return effectiveHeaders;
}

function findHeaderRowIndex(rows: unknown[][]): number | null {
  const detection = detectExcelTargetFromRows(rows, [
    coupangGrowthInventoryHealthTarget.id,
  ]);

  if (!detection.ok) {
    return null;
  }

  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 30); rowIndex += 1) {
    const row = rows[rowIndex];

    if (!Array.isArray(row)) {
      continue;
    }

    const normalizedCells = row.map(normalizeHeader);

    if (
      coupangGrowthInventoryHealthTarget.requiredHeaderKeywords.every(
        (keyword) =>
          normalizedCells.some((cell) =>
            cell.includes(normalizeHeader(keyword)),
          ),
      )
    ) {
      return rowIndex;
    }
  }

  return null;
}

function buildColumnIndexMap(
  effectiveHeaders: string[],
): Partial<Record<InventoryHealthField, number>> {
  const indexMap: Partial<Record<InventoryHealthField, number>> = {};

  for (const entry of inventoryHealthColumnMap) {
    const columnIndex = effectiveHeaders.findIndex((header) =>
      matchesHeader(header, entry),
    );

    if (columnIndex >= 0) {
      indexMap[entry.field] = columnIndex;
    }
  }

  return indexMap;
}

function findNoColumnIndex(mainHeaderRow: unknown[]): number | null {
  const columnIndex = mainHeaderRow.findIndex((cell) => {
    const normalized = normalizeHeader(cell).toLowerCase();
    return normalized === "no" || normalized === "no.";
  });

  return columnIndex >= 0 ? columnIndex : null;
}

function getCell(row: unknown[], index: number | undefined): unknown {
  if (index === undefined) {
    return null;
  }

  return row[index] ?? null;
}

function parseRow(
  row: unknown[],
  columnIndexMap: Partial<Record<InventoryHealthField, number>>,
): ParsedInventoryHealthRow {
  const cell = (field: InventoryHealthField) =>
    getCell(row, columnIndexMap[field]);

  return {
    inventoryId: parseOptionalBigInt(cell("inventoryId")),
    optionId: parseOptionalBigInt(cell("optionId")),
    skuId: parseOptionalBigInt(cell("skuId")),
    productName: parseOptionalString(cell("productName")),
    optionName: parseOptionalString(cell("optionName")),
    offerCondition: parseOptionalString(cell("offerCondition")),
    orderableQuantity: parseOptionalInt(cell("orderableQuantity")),
    pendingInbounds: parseOptionalInt(cell("pendingInbounds")),
    itemWinner: parseOptionalString(cell("itemWinner")),
    recentSales7days: parseOptionalBigInt(cell("recentSales7days")),
    recentSales30days: parseOptionalBigInt(cell("recentSales30days")),
    recentSalesQty7days: parseOptionalInt(cell("recentSalesQty7days")),
    recentSalesQty30days: parseOptionalInt(cell("recentSalesQty30days")),
    recommendedInboundQty: parseOptionalInt(cell("recommendedInboundQty")),
    recommendedInboundDate: parseOptionalString(cell("recommendedInboundDate")),
    daysOfCover: parseOptionalString(cell("daysOfCover")),
    monthlyStorageFee: parseOptionalInt(cell("monthlyStorageFee")),
    skuAge1_30: parseOptionalInt(cell("skuAge1_30")),
    skuAge31_45: parseOptionalInt(cell("skuAge31_45")),
    skuAge46_60: parseOptionalInt(cell("skuAge46_60")),
    skuAge61_120: parseOptionalInt(cell("skuAge61_120")),
    skuAge121_180: parseOptionalInt(cell("skuAge121_180")),
    skuAge181Plus: parseOptionalInt(cell("skuAge181Plus")),
    customerReturns30days: parseOptionalInt(cell("customerReturns30days")),
    season: parseOptionalString(cell("season")),
    productListingDate: parseOptionalDate(cell("productListingDate")),
  };
}

function shouldSkipRow(
  rawRow: unknown[],
  row: ParsedInventoryHealthRow,
  columnIndexMap: Partial<Record<InventoryHealthField, number>>,
  noColumnIndex: number | null,
): boolean {
  if (!columnIndexMap.optionId) {
    return true;
  }

  if (noColumnIndex !== null) {
    const noCell = parseOptionalString(rawRow[noColumnIndex]);

    if (noCell?.includes("예시")) {
      return true;
    }
  }

  if (!row.optionId) {
    return true;
  }

  return false;
}

export function parseInventoryHealth(
  buffer: ArrayBuffer | Buffer,
): ParseInventoryHealthResult {
  const rows = readExcelRows(buffer);
  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === null) {
    return {
      ok: false,
      error: "재고 현황 헤더 행을 찾을 수 없습니다.",
    };
  }

  const mainHeaderRow = rows[headerRowIndex];

  if (!Array.isArray(mainHeaderRow)) {
    return {
      ok: false,
      error: "재고 현황 헤더 행을 찾을 수 없습니다.",
    };
  }

  const subHeaderRow = rows[headerRowIndex + 1];
  const effectiveHeaders = buildEffectiveHeaders(
    mainHeaderRow,
    Array.isArray(subHeaderRow) ? subHeaderRow : undefined,
  );
  const columnIndexMap = buildColumnIndexMap(effectiveHeaders);
  const noColumnIndex = findNoColumnIndex(mainHeaderRow);

  if (columnIndexMap.optionId === undefined) {
    return {
      ok: false,
      error: "옵션 ID 컬럼을 찾을 수 없습니다.",
    };
  }

  const parsedRows: ParsedInventoryHealthRow[] = [];
  let skippedRowCount = 0;
  const dataStartRowIndex = headerRowIndex + 2;

  for (let rowIndex = dataStartRowIndex; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    if (!Array.isArray(row)) {
      skippedRowCount += 1;
      continue;
    }

    const parsedRow = parseRow(row, columnIndexMap);

    if (shouldSkipRow(row, parsedRow, columnIndexMap, noColumnIndex)) {
      skippedRowCount += 1;
      continue;
    }

    parsedRows.push(parsedRow);
  }

  if (parsedRows.length === 0) {
    return {
      ok: false,
      error: "적재할 데이터 행이 없습니다.",
    };
  }

  return { ok: true, rows: parsedRows, skippedRowCount };
}

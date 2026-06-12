import { detectExcelTargetFromRows } from "@/lib/excel/detect-target";
import { normalizeHeader } from "@/lib/excel/normalize-header";
import { readExcelRows } from "@/lib/excel/read-workbook";
import {
  inboundTemplateColumnMap,
  coupangGrowthInboundTemplateTarget,
  type InboundTemplateField,
} from "@/lib/excel/targets/coupang-growth-inbound-template";
import {
  parseOptionalBigInt,
  parseOptionalBoolean,
  parseOptionalDecimal,
  parseOptionalInt,
  parseOptionalString,
} from "@/lib/excel/parsers/parse-cell-values";

export type ParsedInboundTemplateRow = {
  registeredProductName: string | null;
  optionName: string | null;
  sellingPrice: number | null;
  exposedProductId: bigint | null;
  registeredProductId: bigint | null;
  optionId: bigint | null;
  sellingMethod: string | null;
  sales2025Total: bigint | null;
  sales2026Total: bigint | null;
  sales2026_03: bigint | null;
  sales2026_04: bigint | null;
  sales2026_05: bigint | null;
  salesLast14days: bigint | null;
  qtySold2weeks: number | null;
  qtySold1week: number | null;
  sellerFeeRate: string | null;
  sellerFee: number | null;
  cfsEstimatedFee: number | null;
  baseDiscount: number | null;
  discountedEstimatedFee: number | null;
  estSales2weeksByQty: bigint | null;
  shelfLifeDaysInput: string | null;
  expiryDate: string | null;
  manufactureDate: string | null;
  productionYear: string | null;
  productBarcode: string | null;
  productSize: string | null;
  handleWithCare: string | null;
  availableStock: number | null;
  estStockoutDate: string | null;
  category: string | null;
  parallelImport: string | null;
  taxType: string | null;
  skuId: bigint | null;
  reqExpDate: boolean | null;
  reqManDate: boolean | null;
  reqProdYear: boolean | null;
};

export type ParseInboundTemplateResult =
  | { ok: true; rows: ParsedInboundTemplateRow[]; skippedRowCount: number }
  | { ok: false; error: string };

type ColumnMapEntry = (typeof inboundTemplateColumnMap)[number];

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

function findHeaderRowIndex(rows: unknown[][]): number | null {
  const detection = detectExcelTargetFromRows(
    rows,
    [coupangGrowthInboundTemplateTarget.id],
  );

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
      coupangGrowthInboundTemplateTarget.requiredHeaderKeywords.every(
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
  headerRow: unknown[],
): Partial<Record<InboundTemplateField, number>> {
  const indexMap: Partial<Record<InboundTemplateField, number>> = {};

  for (const entry of inboundTemplateColumnMap) {
    const columnIndex = headerRow.findIndex((cell) => matchesHeader(cell, entry));

    if (columnIndex >= 0) {
      indexMap[entry.field] = columnIndex;
    }
  }

  return indexMap;
}

function getCell(row: unknown[], index: number | undefined): unknown {
  if (index === undefined) {
    return null;
  }

  return row[index] ?? null;
}

function parseRow(
  row: unknown[],
  columnIndexMap: Partial<Record<InboundTemplateField, number>>,
): ParsedInboundTemplateRow {
  const cell = (field: InboundTemplateField) =>
    getCell(row, columnIndexMap[field]);

  return {
    registeredProductName: parseOptionalString(cell("registeredProductName")),
    optionName: parseOptionalString(cell("optionName")),
    sellingPrice: parseOptionalInt(cell("sellingPrice")),
    exposedProductId: parseOptionalBigInt(cell("exposedProductId")),
    registeredProductId: parseOptionalBigInt(cell("registeredProductId")),
    optionId: parseOptionalBigInt(cell("optionId")),
    sellingMethod: parseOptionalString(cell("sellingMethod")),
    sales2025Total: parseOptionalBigInt(cell("sales2025Total")),
    sales2026Total: parseOptionalBigInt(cell("sales2026Total")),
    sales2026_03: parseOptionalBigInt(cell("sales2026_03")),
    sales2026_04: parseOptionalBigInt(cell("sales2026_04")),
    sales2026_05: parseOptionalBigInt(cell("sales2026_05")),
    salesLast14days: parseOptionalBigInt(cell("salesLast14days")),
    qtySold2weeks: parseOptionalInt(cell("qtySold2weeks")),
    qtySold1week: parseOptionalInt(cell("qtySold1week")),
    sellerFeeRate: parseOptionalDecimal(cell("sellerFeeRate")),
    sellerFee: parseOptionalInt(cell("sellerFee")),
    cfsEstimatedFee: parseOptionalInt(cell("cfsEstimatedFee")),
    baseDiscount: parseOptionalInt(cell("baseDiscount")),
    discountedEstimatedFee: parseOptionalInt(cell("discountedEstimatedFee")),
    estSales2weeksByQty: parseOptionalBigInt(cell("estSales2weeksByQty")),
    shelfLifeDaysInput: parseOptionalString(cell("shelfLifeDaysInput")),
    expiryDate: parseOptionalString(cell("expiryDate")),
    manufactureDate: parseOptionalString(cell("manufactureDate")),
    productionYear: parseOptionalString(cell("productionYear")),
    productBarcode: parseOptionalString(cell("productBarcode")),
    productSize: parseOptionalString(cell("productSize")),
    handleWithCare: parseOptionalString(cell("handleWithCare")),
    availableStock: parseOptionalInt(cell("availableStock")),
    estStockoutDate: parseOptionalString(cell("estStockoutDate")),
    category: parseOptionalString(cell("category")),
    parallelImport: parseOptionalString(cell("parallelImport")),
    taxType: parseOptionalString(cell("taxType")),
    skuId: parseOptionalBigInt(cell("skuId")),
    reqExpDate: parseOptionalBoolean(cell("reqExpDate")),
    reqManDate: parseOptionalBoolean(cell("reqManDate")),
    reqProdYear: parseOptionalBoolean(cell("reqProdYear")),
  };
}

function findNoColumnIndex(headerRow: unknown[]): number | null {
  const columnIndex = headerRow.findIndex((cell) => {
    const normalized = normalizeHeader(cell).toLowerCase();
    return normalized === "no" || normalized === "no.";
  });

  return columnIndex >= 0 ? columnIndex : null;
}

function shouldSkipRow(
  rawRow: unknown[],
  row: ParsedInboundTemplateRow,
  columnIndexMap: Partial<Record<InboundTemplateField, number>>,
  noColumnIndex: number | null,
): boolean {
  if (!columnIndexMap.registeredProductName) {
    return true;
  }

  if (noColumnIndex !== null) {
    const noCell = parseOptionalString(rawRow[noColumnIndex]);

    if (noCell?.includes("예시")) {
      return true;
    }
  }

  const productName = row.registeredProductName;

  if (!productName) {
    return true;
  }

  if (productName.includes("예시")) {
    return true;
  }

  return false;
}

export function parseInboundTemplate(
  buffer: ArrayBuffer | Buffer,
): ParseInboundTemplateResult {
  const rows = readExcelRows(buffer);
  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === null) {
    return {
      ok: false,
      error: "입고 생성 템플릿 헤더 행을 찾을 수 없습니다.",
    };
  }

  const headerRow = rows[headerRowIndex];

  if (!Array.isArray(headerRow)) {
    return {
      ok: false,
      error: "입고 생성 템플릿 헤더 행을 찾을 수 없습니다.",
    };
  }

  const columnIndexMap = buildColumnIndexMap(headerRow);
  const noColumnIndex = findNoColumnIndex(headerRow);

  if (columnIndexMap.registeredProductName === undefined) {
    return {
      ok: false,
      error: "등록상품명 컬럼을 찾을 수 없습니다.",
    };
  }

  const parsedRows: ParsedInboundTemplateRow[] = [];
  let skippedRowCount = 0;

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
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

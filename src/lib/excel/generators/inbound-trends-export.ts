import * as XLSX from "xlsx";

import type { InboundTrendsRowView } from "@/services/inbound-trends/types";

const FIXED_COLUMN_KEYS = [
  "상품명",
  "옵션명",
  "자사상품코드",
  "샵플링 옵션 벨류",
  "바코드",
] as const;

const MIN_COLUMN_WIDTHS = [30, 25, 14, 20, 18];

function getDisplayWidth(value: string): number {
  let width = 0;

  for (const character of value) {
    width += character.charCodeAt(0) > 0x7f ? 2 : 1;
  }

  return width;
}

export function buildInboundTrendsDateColumnKeys(date: string): [string, string] {
  return [`${date}(완)`, date];
}

export function buildInboundTrendsColumnKeys(dates: string[]): string[] {
  const dateKeys = dates.flatMap((date) => buildInboundTrendsDateColumnKeys(date));

  return [...FIXED_COLUMN_KEYS, ...dateKeys];
}

function formatQty(value: number | null | undefined): string | number {
  if (value === null || value === undefined) {
    return "";
  }

  return value;
}

function toOutputRows(
  rows: InboundTrendsRowView[],
  dates: string[],
): Record<string, string | number>[] {
  return rows.map((row) => {
    const outputRow: Record<string, string | number> = {
      상품명: row.registeredProductName ?? "",
      옵션명: row.optionName ?? "",
      자사상품코드: row.ptnGoodsCd ?? "",
      "샵플링 옵션 벨류": row.shoplingOptionValue ?? "",
      바코드: row.productBarcode ?? "",
    };

    for (const date of dates) {
      const values = row.dateValues[date];
      const [coupangKey, warehouseKey] = buildInboundTrendsDateColumnKeys(date);

      outputRow[coupangKey] = formatQty(values?.coupang);
      outputRow[warehouseKey] = formatQty(values?.warehouse);
    }

    return outputRow;
  });
}

export function buildInboundTrendsFilename(
  sellerDisplayName: string,
  from: string,
  to: string,
): string {
  const slug = sellerDisplayName.trim().replace(/\s+/g, "_");

  return `추세조회_${slug}_${from}_${to}.xlsx`;
}

export function generateInboundTrendsBuffer(
  rows: InboundTrendsRowView[],
  dates: string[],
): Buffer {
  const columnKeys = buildInboundTrendsColumnKeys(dates);
  const outputRows = toOutputRows(rows, dates);
  const worksheet = XLSX.utils.json_to_sheet(outputRows, {
    header: columnKeys,
  });

  worksheet["!cols"] = columnKeys.map((key, index) => {
    const minWidth =
      index < MIN_COLUMN_WIDTHS.length
        ? MIN_COLUMN_WIDTHS[index]!
        : 12;
    const maxLen = Math.max(
      minWidth,
      getDisplayWidth(key),
      ...outputRows.map((row) => getDisplayWidth(String(row[key] ?? ""))),
    );

    return { wch: Math.min(maxLen + 4, 80) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "추세조회");

  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

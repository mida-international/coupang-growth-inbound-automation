import * as XLSX from "xlsx";

import { autoFitWorksheetColumns } from "@/lib/excel/auto-fit-worksheet-columns";
import type { InboundTrendsRowView } from "@/services/inbound-trends/types";

const FIXED_HEADERS = [
  "상품명",
  "옵션명",
  "자사상품코드",
  "샵플링 옵션 벨류",
  "바코드",
] as const;

const FIXED_COLUMN_COUNT = FIXED_HEADERS.length;

export function formatTrendsDateHeader(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

/** @deprecated Flat keys kept for compatibility tests only */
export function buildInboundTrendsDateColumnKeys(date: string): [string, string] {
  return [`${date}(완)`, date];
}

/** @deprecated Use merged 2-row header export instead */
export function buildInboundTrendsColumnKeys(dates: string[]): string[] {
  const dateKeys = dates.flatMap((date) => buildInboundTrendsDateColumnKeys(date));

  return [...FIXED_HEADERS, ...dateKeys];
}

function formatQty(value: number | null | undefined): string | number {
  if (value === null || value === undefined) {
    return "";
  }

  return value;
}

function buildTrendsSheetAoa(
  rows: InboundTrendsRowView[],
  dates: string[],
): (string | number)[][] {
  const headerRow1: string[] = [...FIXED_HEADERS];
  const headerRow2: string[] = ["", "", "", "", ""];

  for (const date of dates) {
    const label = formatTrendsDateHeader(date);
    headerRow1.push(label, "");
    headerRow2.push(`${label}(완)`, label);
  }

  const dataRows = rows.map((row) => {
    const base = [
      row.registeredProductName ?? "",
      row.optionName ?? "",
      row.ptnGoodsCd ?? "",
      row.shoplingOptionValue ?? "",
      row.productBarcode ?? "",
    ];

    const dateCells = dates.flatMap((date) => {
      const values = row.dateValues[date];
      return [formatQty(values?.coupang), formatQty(values?.warehouse)];
    });

    return [...base, ...dateCells];
  });

  return [headerRow1, headerRow2, ...dataRows];
}

function buildTrendsHeaderMerges(dates: string[]) {
  const merges: XLSX.Range[] = [];

  for (let columnIndex = 0; columnIndex < FIXED_COLUMN_COUNT; columnIndex += 1) {
    merges.push({
      s: { r: 0, c: columnIndex },
      e: { r: 1, c: columnIndex },
    });
  }

  dates.forEach((_, index) => {
    const startColumn = FIXED_COLUMN_COUNT + index * 2;
    merges.push({
      s: { r: 0, c: startColumn },
      e: { r: 0, c: startColumn + 1 },
    });
  });

  return merges;
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
  const aoa = buildTrendsSheetAoa(rows, dates);
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet["!merges"] = buildTrendsHeaderMerges(dates);
  autoFitWorksheetColumns(worksheet);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "추세조회");

  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

export function getInboundTrendsSubHeaderLabels(dates: string[]): string[] {
  return dates.flatMap((date) => {
    const label = formatTrendsDateHeader(date);
    return [`${label}(완)`, label];
  });
}

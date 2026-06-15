import * as XLSX from "xlsx";

import { getKstTodayDate } from "@/lib/date/kst-today";
import type { WarehouseInboundListRow } from "@/services/deliverables/types";

type WarehouseInboundOutputRow = {
  box: string;
  date: string;
  location: string;
  등록상품명: string;
  옵션명: string;
  바코드: string;
  수량: number;
};

const COLUMN_KEYS = [
  "box",
  "date",
  "location",
  "등록상품명",
  "옵션명",
  "바코드",
  "수량",
] as const;

const MIN_COLUMN_WIDTHS = [6, 12, 10, 30, 25, 18, 8];

function formatKstIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getKstSheetName(date: Date): string {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  return `${month}.${day}요청`;
}

function getDisplayWidth(value: string): number {
  let width = 0;

  for (const character of value) {
    width += character.charCodeAt(0) > 0x7f ? 2 : 1;
  }

  return width;
}

function toOutputRows(
  rows: WarehouseInboundListRow[],
  today: string,
): WarehouseInboundOutputRow[] {
  const output: WarehouseInboundOutputRow[] = [];
  let boxNum = 1;

  for (let index = 0; index < rows.length; index++) {
    if (index > 0 && index % 50 === 0) {
      boxNum++;
    }

    const row = rows[index];

    output.push({
      box: String(boxNum),
      date: today,
      location: row.location ?? "",
      등록상품명: row.registeredProductName ?? "",
      옵션명: row.optionName ?? "",
      바코드: row.productBarcode ?? "",
      수량: row.growthInboundRecommend,
    });
  }

  return output;
}

export function buildWarehouseInboundListFilename(
  displayName: string,
  date = getKstTodayDate(),
): string {
  const datePart = formatKstIsoDate(date);
  const slug = displayName.trim().replace(/\s+/g, "_");

  return `창고전송용_입고리스트_${datePart}_${slug}.xlsx`;
}

export function generateWarehouseInboundListBuffer(
  rows: WarehouseInboundListRow[],
): Buffer {
  const todayDate = getKstTodayDate();
  const today = formatKstIsoDate(todayDate);
  const outputRows = toOutputRows(rows, today);
  const worksheet = XLSX.utils.json_to_sheet(outputRows);

  worksheet["!cols"] = COLUMN_KEYS.map((key, index) => {
    const maxLen = Math.max(
      MIN_COLUMN_WIDTHS[index],
      getDisplayWidth(key),
      ...outputRows.map((row) => getDisplayWidth(String(row[key] ?? ""))),
    );

    return { wch: Math.min(maxLen + 4, 80) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    getKstSheetName(todayDate),
  );

  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

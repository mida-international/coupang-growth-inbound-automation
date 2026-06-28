import * as XLSX from "xlsx";

import type { VisionExtractedData } from "@/lib/vision/types";

export const BOX_LIST_EXCEL_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** 출력 엑셀 컬럼(고정 순서). */
const OUTPUT_COLUMNS = [
  "date",
  "location",
  "등록상품명",
  "옵션",
  "바코드",
  "수량",
  "가용",
] as const;

/** 각 출력 컬럼에 대해 vision row에서 값을 찾을 때 시도할 키들. */
const COLUMN_KEY_ALIASES: Record<(typeof OUTPUT_COLUMNS)[number], string[]> = {
  date: ["date", "날짜", "일자"],
  location: ["location", "로케이션", "위치"],
  등록상품명: ["등록상품명", "상품명", "product", "productName"],
  옵션: ["옵션", "옵션명", "option"],
  바코드: ["바코드", "barcode", "상품코드", "code", "sku"],
  수량: ["수량", "qty", "quantity", "개수"],
  가용: ["가용", "가용수량", "available"],
};

function pickCell(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export function buildBoxListExcelFilename(prefix = "box-list-from-image") {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);

  return `${prefix}-${timestamp}.xlsx`;
}

export function buildBoxListExcelBytes(
  visionData: VisionExtractedData,
): Uint8Array {
  const rows = visionData.rows
    .map((row) => {
      const output: Record<string, string> = {};
      for (const column of OUTPUT_COLUMNS) {
        output[column] = pickCell(row, COLUMN_KEY_ALIASES[column]);
      }
      return output;
    })
    // 바코드(셀 데이터)가 있는 행만 — 공백/비데이터 행 제외
    .filter((row) => /^\d{6,14}$/.test(row["바코드"].replace(/\s/g, "")));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [...OUTPUT_COLUMNS],
  });

  // 컬럼 너비(문자 수 기준) — 값이 잘리지 않고 다 보이도록 넉넉히
  worksheet["!cols"] = [
    { wch: 12 }, // date
    { wch: 14 }, // location
    { wch: 40 }, // 등록상품명
    { wch: 32 }, // 옵션
    { wch: 18 }, // 바코드
    { wch: 8 }, // 수량
    { wch: 8 }, // 가용
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // XLSX.write({type:"array"})는 런타임에 ArrayBuffer를 반환하므로 항상 Uint8Array로 정규화한다.
  const written = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as
    | ArrayBuffer
    | Uint8Array;

  return written instanceof Uint8Array ? written : new Uint8Array(written);
}

export function buildBoxListExcelBuffer(
  visionData: VisionExtractedData,
): Buffer {
  return Buffer.from(buildBoxListExcelBytes(visionData));
}

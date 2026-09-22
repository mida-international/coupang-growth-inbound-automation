import * as XLSX from "xlsx";

import { isCorrectedRow } from "@/lib/vision/compute-vision-stats";
import { VISION_LOW_CONFIDENCE_THRESHOLD } from "@/lib/vision/constants";
import type { VisionExtractedData } from "@/lib/vision/types";

export const BOX_LIST_EXCEL_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** 출력 엑셀 컬럼(고정 순서). 기존 7열은 그대로 두고, 검수용 3열을 뒤에 덧붙인다. */
const OUTPUT_COLUMNS = [
  "date",
  "location",
  "등록상품명",
  "옵션",
  "바코드",
  "수량",
  "가용",
] as const;

/**
 * 검수용 추가 컬럼 (뒤에 붙임 — 기존 파서는 열 이름으로 찾으므로 영향 없음)
 * - 수정전: 빨간 펜으로 고치기 전 인쇄 수량 (수정된 행에만 값이 있음)
 * - 신뢰도: 모델이 준 확신도 0~1
 * - 확인필요: 신뢰도가 기준 미만이면 "확인" — 사람이 이 행만 종이와 대조하면 됨
 */
const REVIEW_COLUMNS = ["수정전", "신뢰도", "확인필요"] as const;

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

      // 검수용 3열
      const confidenceRaw = row.confidence ?? row["confidence"];
      const confidence = Number(confidenceRaw);
      const hasConfidence =
        confidenceRaw !== undefined && confidenceRaw !== "" && !Number.isNaN(confidence);

      output["수정전"] = isCorrectedRow(row)
        ? (row["printedQty"]?.trim() || row["가용"]?.trim() || "")
        : "";
      output["신뢰도"] = hasConfidence ? confidence.toFixed(2) : "";
      output["확인필요"] =
        hasConfidence && confidence < VISION_LOW_CONFIDENCE_THRESHOLD ? "확인" : "";

      return output;
    })
    // 바코드(셀 데이터)가 있는 행만 — 공백/비데이터 행 제외
    .filter((row) => /^\d{6,14}$/.test(row["바코드"].replace(/\s/g, "")));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [...OUTPUT_COLUMNS, ...REVIEW_COLUMNS],
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
    { wch: 8 }, // 수정전
    { wch: 8 }, // 신뢰도
    { wch: 10 }, // 확인필요
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

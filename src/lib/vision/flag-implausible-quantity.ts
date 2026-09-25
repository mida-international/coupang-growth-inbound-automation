import type { VisionExtractedRow } from "@/lib/vision/types";

/**
 * 인쇄 수량보다 훨씬 큰 값으로 읽힌 행에 매기는 신뢰도.
 * 저신뢰(0.7 미만)라서 화면·엑셀에 "확인 필요"로 표시된다.
 */
export const IMPLAUSIBLE_QTY_CONFIDENCE = "0.3";

/** "훨씬 큰 값" 기준: 인쇄 수량의 2배 이상이면서 3개 이상 많을 때 */
const RATIO = 2;
const MIN_EXCESS = 3;

function toInt(value: string | undefined): number | null {
  const digits = (value ?? "").trim();

  return /^\d+$/.test(digits) ? Number(digits) : null;
}

/**
 * 현장은 수량을 줄이거나 0으로만 고치고, 임의로 늘리지 않는다(대표 방침 2026-09-25).
 * 그래서 인쇄 수량보다 훨씬 큰 값은 오독일 가능성이 높다.
 *   실제 사례: 9/3 인쇄 12 → (0·8 지움) → 7 을 "87"로 읽어 87개 요청, 실제 입고 7개.
 * 작은 증가(5→6 등)는 표시하지 않는다 — 수량 증가 경고는 넣지 않기로 결정.
 */
export function isImplausibleQuantity(row: VisionExtractedRow): boolean {
  const printed = toInt(row["printedQty"]);
  const qty = toInt(row["수량"]);

  if (printed === null || qty === null || printed <= 0) {
    return false;
  }

  return qty >= printed * RATIO && qty - printed >= MIN_EXCESS;
}

export function flagImplausibleQuantities(rows: VisionExtractedRow[]): VisionExtractedRow[] {
  return rows.map((row) => {
    if (!isImplausibleQuantity(row)) {
      return row;
    }

    const current = Number(row.confidence);
    const lowered =
      Number.isNaN(current) || current > Number(IMPLAUSIBLE_QTY_CONFIDENCE)
        ? IMPLAUSIBLE_QTY_CONFIDENCE
        : (row.confidence ?? IMPLAUSIBLE_QTY_CONFIDENCE);

    return { ...row, confidence: lowered };
  });
}

import type { VisionExtractedRow } from "@/lib/vision/types";

/** 두 판독이 어긋난 행에 매기는 신뢰도 — 저신뢰(0.7 미만)로 표시돼 사람이 확인하게 된다. */
export const DISPUTED_ROW_CONFIDENCE = "0.6";

export type VisionDispute = {
  id: string;
  a: VisionExtractedRow | null;
  b: VisionExtractedRow | null;
};

export type VisionArbitrationDecision = {
  id: string;
  exists: boolean;
  바코드: string;
  수량: string;
  printedQty: string;
};

type Slot = {
  row: VisionExtractedRow;
  disputeId: string | null;
};

export type ReconcileResult = {
  slots: Slot[];
  disputes: VisionDispute[];
};

function normalizeBarcode(row: VisionExtractedRow): string {
  return (row["바코드"] ?? "").replace(/\s/g, "");
}

function normalizeQty(row: VisionExtractedRow): string {
  return (row["수량"] ?? "").replace(/[^\d-]/g, "");
}

/** 같은 바코드가 여러 번 나오면 등장 순서(n번째)까지 묶어서 키를 만든다. */
function keyRows(rows: VisionExtractedRow[]): string[] {
  const seen = new Map<string, number>();

  return rows.map((row) => {
    const barcode = normalizeBarcode(row);
    const occurrence = seen.get(barcode) ?? 0;
    seen.set(barcode, occurrence + 1);

    return `${barcode}#${occurrence}`;
  });
}

/**
 * 독립적으로 판독한 두 결과(a = 기준, b = 대조)를 바코드 기준으로 맞춘다.
 * - 바코드·수량이 모두 같으면 그대로 채택
 * - 수량이 다르거나 한쪽에만 있는 행은 dispute 로 모아 재판정 대상으로 넘긴다
 * 행 순서와 상품명/옵션은 기준(a) 판독을 따른다.
 */
export function reconcileVisionRows(
  a: VisionExtractedRow[],
  b: VisionExtractedRow[],
): ReconcileResult {
  const aKeys = keyRows(a);
  const bKeys = keyRows(b);
  const bByKey = new Map(bKeys.map((key, index) => [key, b[index]]));
  const matchedBKeys = new Set<string>();
  const slots: Slot[] = [];
  const disputes: VisionDispute[] = [];

  a.forEach((row, index) => {
    const key = aKeys[index];
    const other = bByKey.get(key);

    if (other && normalizeQty(other) === normalizeQty(row)) {
      matchedBKeys.add(key);
      slots.push({ row, disputeId: null });
      return;
    }

    if (other) {
      matchedBKeys.add(key);
    }

    const id = `d${disputes.length + 1}`;
    disputes.push({ id, a: row, b: other ?? null });
    slots.push({ row, disputeId: id });
  });

  // b 에만 있는 행: b 에서 바로 앞 행이 놓인 자리 뒤에 끼워 넣는다.
  b.forEach((row, index) => {
    const key = bKeys[index];

    if (matchedBKeys.has(key)) {
      return;
    }

    const id = `d${disputes.length + 1}`;
    disputes.push({ id, a: null, b: row });

    const previousKey = index > 0 ? bKeys[index - 1] : null;
    const previousSlotIndex = previousKey
      ? slots.findIndex(
          (slot, slotIndex) => aKeys[slotIndex] === previousKey,
        )
      : -1;
    const newSlot = { row, disputeId: id };

    if (previousSlotIndex === -1) {
      slots.push(newSlot);
    } else {
      slots.splice(previousSlotIndex + 1, 0, newSlot);
      aKeys.splice(previousSlotIndex + 1, 0, key);
    }
  });

  return { slots, disputes };
}

/**
 * 재판정 결과를 반영해 최종 행을 만든다.
 * 판정이 없는(실패한) dispute 는 기준 판독을 유지하되 저신뢰로 표시한다.
 */
export function applyArbitration(
  result: ReconcileResult,
  decisions: VisionArbitrationDecision[],
): VisionExtractedRow[] {
  const decisionById = new Map(decisions.map((decision) => [decision.id, decision]));
  const rows: VisionExtractedRow[] = [];

  for (const slot of result.slots) {
    if (!slot.disputeId) {
      rows.push(slot.row);
      continue;
    }

    const decision = decisionById.get(slot.disputeId);

    if (decision && !decision.exists) {
      continue;
    }

    rows.push({
      ...slot.row,
      ...(decision
        ? {
            바코드: decision.바코드 || slot.row["바코드"],
            수량: decision.수량,
            printedQty: decision.printedQty,
          }
        : {}),
      confidence: DISPUTED_ROW_CONFIDENCE,
    });
  }

  return dedupeByBarcode(rows);
}

/** 서로 다른 dispute 가 같은 행으로 판정되면(바코드 오인식 쌍) 중복을 하나로 합친다. */
function dedupeByBarcode(rows: VisionExtractedRow[]): VisionExtractedRow[] {
  const disputedSeen = new Set<string>();

  return rows.filter((row) => {
    if (row.confidence !== DISPUTED_ROW_CONFIDENCE) {
      return true;
    }

    const key = `${normalizeBarcode(row)}|${normalizeQty(row)}`;

    if (disputedSeen.has(key)) {
      return false;
    }

    disputedSeen.add(key);
    return true;
  });
}

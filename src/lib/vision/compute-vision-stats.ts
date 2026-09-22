import { VISION_LOW_CONFIDENCE_THRESHOLD } from "@/lib/vision/constants";
import type { VisionExtractedData, VisionExtractStats } from "@/lib/vision/types";

function isValidBarcode(value: string): boolean {
  const normalized = value.trim().replace(/\s/g, "");
  return /^\d{6,14}$/.test(normalized);
}

/**
 * 유효 수량 = 수량(보정 완료값). 프롬프트 규칙상 가용은 항상 ""이므로
 * 가용은 수량이 비어 있을 때의 폴백으로만 쓴다.
 * (이전에는 가용을 우선했으나, 가용에 값이 들어오면 잘못된 수량이 채택될 수 있어 순서를 바꿈)
 */
function resolveEffectiveQty(row: Record<string, string>): string | null {
  const qty = row["수량"]?.trim();
  const available = row["가용"]?.trim();

  if (qty) {
    return qty;
  }

  return available || null;
}

/**
 * 수정 여부 판정.
 * - 신규: printedQty(수정 전 인쇄 수량)가 있고 수량과 다르면 수정된 행
 * - 레거시: 가용이 채워져 있고 수량과 다르면 수정된 행 (예전 프롬프트 호환)
 */
export function isCorrectedRow(row: Record<string, string>): boolean {
  const qty = row["수량"]?.trim() ?? "";
  const printed = row["printedQty"]?.trim() ?? "";
  const available = row["가용"]?.trim() ?? "";

  if (printed && qty && printed !== qty) {
    return true;
  }

  if (available && qty && available !== qty) {
    return true;
  }

  return false;
}

export function computeVisionStats(
  visionData: VisionExtractedData,
  options: { imageCount: number; boxNumbers: string[] },
): VisionExtractStats {
  let validBarcodeRows = 0;
  let skippedRows = 0;
  let lowConfidenceRows = 0;
  let correctionCount = 0;

  for (const row of visionData.rows) {
    const barcode = row["바코드"]?.trim().replace(/\s/g, "") ?? "";
    const qtyRaw = resolveEffectiveQty(row);

    if (!barcode || !qtyRaw) {
      skippedRows += 1;
      continue;
    }

    if (!isValidBarcode(barcode)) {
      skippedRows += 1;
      continue;
    }

    validBarcodeRows += 1;

    if (isCorrectedRow(row)) {
      correctionCount += 1;
    }

    const confidence = Number(row.confidence ?? row["confidence"]);

    if (!Number.isNaN(confidence) && confidence < VISION_LOW_CONFIDENCE_THRESHOLD) {
      lowConfidenceRows += 1;
    }
  }

  return {
    imageCount: options.imageCount,
    rowCount: visionData.rows.length,
    validBarcodeRows,
    skippedRows,
    lowConfidenceRows,
    correctionCount,
    boxNumbers: options.boxNumbers,
  };
}

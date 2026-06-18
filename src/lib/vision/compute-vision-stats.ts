import { VISION_LOW_CONFIDENCE_THRESHOLD } from "@/lib/vision/constants";
import type { VisionExtractedData, VisionExtractStats } from "@/lib/vision/types";

function isValidBarcode(value: string): boolean {
  const normalized = value.trim().replace(/\s/g, "");
  return /^\d{6,14}$/.test(normalized);
}

function resolveEffectiveQty(row: Record<string, string>): string | null {
  const available = row["가용"]?.trim();
  const qty = row["수량"]?.trim();

  if (available) {
    return available;
  }

  return qty ?? null;
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

    const printedQty = row["수량"]?.trim();
    const availableQty = row["가용"]?.trim();

    if (
      availableQty &&
      printedQty &&
      availableQty !== printedQty
    ) {
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

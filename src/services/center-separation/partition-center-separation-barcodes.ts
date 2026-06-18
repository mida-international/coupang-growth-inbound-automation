import { normalizeCenterSeparationBarcode } from "@/lib/center-separation/normalize-barcode";

export type ValidateCenterSeparationBarcodesResult = {
  knownBarcodes: string[];
  missingBarcodes: string[];
};

export function partitionCenterSeparationBarcodes(
  barcodes: string[],
  knownInDashboard: Set<string>,
): ValidateCenterSeparationBarcodesResult {
  const knownBarcodes: string[] = [];
  const missingBarcodes: string[] = [];
  const seen = new Set<string>();

  for (const barcode of barcodes) {
    const normalized = normalizeCenterSeparationBarcode(barcode);

    if (normalized === "" || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);

    if (knownInDashboard.has(normalized)) {
      knownBarcodes.push(normalized);
    } else {
      missingBarcodes.push(normalized);
    }
  }

  return { knownBarcodes, missingBarcodes };
}

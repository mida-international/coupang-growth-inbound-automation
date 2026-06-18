import { normalizeCenterSeparationBarcode } from "@/lib/center-separation/normalize-barcode";
import { prisma } from "@/lib/db";
import type {
  CenterSeparationServiceResult,
  UpsertCenterSeparationResult,
} from "@/services/center-separation/types";
import {
  CENTER_SEPARATION_ALREADY_EXISTS_ERROR,
  CENTER_SEPARATION_MISSING_BARCODE_ERROR,
} from "@/services/center-separation/types";
import { upsertCenterSeparationBarcodes } from "@/services/center-separation/upsert-center-separation-barcodes";
import { validateCenterSeparationBarcodes } from "@/services/center-separation/validate-center-separation-barcodes";

export async function createCenterSeparationBarcode(
  barcode: string,
): Promise<CenterSeparationServiceResult<UpsertCenterSeparationResult>> {
  const normalized = normalizeCenterSeparationBarcode(barcode);

  if (normalized === "") {
    return { ok: false, error: "바코드를 입력해 주세요." };
  }

  const { knownBarcodes, missingBarcodes } =
    await validateCenterSeparationBarcodes([normalized]);

  if (knownBarcodes.length === 0) {
    return {
      ok: false,
      error: CENTER_SEPARATION_MISSING_BARCODE_ERROR,
      missingBarcodes,
    };
  }

  const existing = await prisma.coupangCenterSeparation.findUnique({
    where: { barcode: normalized },
    select: { barcode: true },
  });

  if (existing) {
    return {
      ok: false,
      error: CENTER_SEPARATION_ALREADY_EXISTS_ERROR,
      existingBarcodes: [normalized],
    };
  }

  return upsertCenterSeparationBarcodes([normalized]);
}

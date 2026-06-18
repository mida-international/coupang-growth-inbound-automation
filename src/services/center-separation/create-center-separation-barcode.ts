import type {
  CenterSeparationServiceResult,
  UpsertCenterSeparationResult,
} from "@/services/center-separation/types";
import { upsertCenterSeparationBarcodes } from "@/services/center-separation/upsert-center-separation-barcodes";

export async function createCenterSeparationBarcode(
  barcode: string,
): Promise<CenterSeparationServiceResult<UpsertCenterSeparationResult>> {
  const normalized = barcode.trim();

  if (normalized === "") {
    return { ok: false, error: "바코드를 입력해 주세요." };
  }

  return upsertCenterSeparationBarcodes([normalized]);
}

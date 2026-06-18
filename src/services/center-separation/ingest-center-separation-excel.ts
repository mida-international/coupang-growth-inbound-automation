import { parseCenterSeparation } from "@/lib/excel/parsers/parse-center-separation";
import type {
  CenterSeparationServiceResult,
  UpsertCenterSeparationResult,
} from "@/services/center-separation/types";
import { upsertCenterSeparationBarcodes } from "@/services/center-separation/upsert-center-separation-barcodes";

function dedupeRowsByBarcode<
  T extends { barcode: string },
>(rows: T[]): T[] {
  const byBarcode = new Map<string, T>();

  for (const row of rows) {
    byBarcode.set(row.barcode, row);
  }

  return [...byBarcode.values()];
}

export async function ingestCenterSeparationExcel(
  buffer: Buffer,
): Promise<CenterSeparationServiceResult<UpsertCenterSeparationResult>> {
  const parsed = parseCenterSeparation(buffer);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const dedupedRows = dedupeRowsByBarcode(parsed.rows);

  return upsertCenterSeparationBarcodes(
    dedupedRows.map((row) => row.barcode),
    { skippedEmptyBarcode: parsed.skippedEmptyBarcode },
  );
}

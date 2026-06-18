import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  partitionCenterSeparationBarcodes,
  type ValidateCenterSeparationBarcodesResult,
} from "@/services/center-separation/partition-center-separation-barcodes";

function dedupeBarcodes(barcodes: string[]): string[] {
  const unique = new Map<string, string>();

  for (const barcode of barcodes) {
    const normalized = barcode.trim();

    if (normalized === "") {
      continue;
    }

    unique.set(normalized, normalized);
  }

  return [...unique.values()];
}

export async function validateCenterSeparationBarcodes(
  barcodes: string[],
): Promise<ValidateCenterSeparationBarcodesResult> {
  const dedupedBarcodes = dedupeBarcodes(barcodes);

  if (dedupedBarcodes.length === 0) {
    return { knownBarcodes: [], missingBarcodes: [] };
  }

  const rows = await prisma.$queryRaw<{ barcode: string }[]>(
    Prisma.sql`
      SELECT DISTINCT TRIM(product_barcode) AS barcode
      FROM inbound_trends_row_v
      WHERE product_barcode IS NOT NULL
        AND TRIM(product_barcode) <> ''
        AND TRIM(product_barcode) IN (${Prisma.join(dedupedBarcodes)})
    `,
  );

  const knownInDashboard = new Set(rows.map((row) => row.barcode));

  return partitionCenterSeparationBarcodes(dedupedBarcodes, knownInDashboard);
}

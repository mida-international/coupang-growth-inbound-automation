import { normalizeCenterSeparationBarcode } from "@/lib/center-separation/normalize-barcode";
import { prisma } from "@/lib/db";

export async function loadCenterSeparationBarcodeSet(): Promise<Set<string>> {
  const rows = await prisma.coupangCenterSeparation.findMany({
    select: { barcode: true },
  });

  const barcodes = new Set<string>();

  for (const row of rows) {
    const normalized = normalizeCenterSeparationBarcode(row.barcode);

    if (normalized !== "") {
      barcodes.add(normalized);
    }
  }

  return barcodes;
}

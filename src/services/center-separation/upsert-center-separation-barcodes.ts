import { prisma } from "@/lib/db";
import { normalizeCenterSeparationBarcode } from "@/lib/center-separation/normalize-barcode";
import { partitionKnownBarcodesByExisting } from "@/services/center-separation/partition-known-barcodes-by-existing";
import type {
  CenterSeparationServiceResult,
  UpsertCenterSeparationResult,
} from "@/services/center-separation/types";
import { validateCenterSeparationBarcodes } from "@/services/center-separation/validate-center-separation-barcodes";

function dedupeBarcodes(barcodes: string[]): string[] {
  const unique = new Map<string, string>();

  for (const barcode of barcodes) {
    const normalized = normalizeCenterSeparationBarcode(barcode);

    if (normalized === "") {
      continue;
    }

    unique.set(normalized, normalized);
  }

  return [...unique.values()];
}

export async function upsertCenterSeparationBarcodes(
  barcodes: string[],
  options?: { skippedEmptyBarcode?: number },
): Promise<CenterSeparationServiceResult<UpsertCenterSeparationResult>> {
  const dedupedBarcodes = dedupeBarcodes(barcodes);
  const skippedEmptyBarcode = options?.skippedEmptyBarcode ?? 0;

  if (dedupedBarcodes.length === 0) {
    return {
      ok: false,
      error: "등록할 바코드가 없습니다. 바코드를 입력해 주세요.",
    };
  }

  const { missingBarcodes } =
    await validateCenterSeparationBarcodes(dedupedBarcodes);

  const existingInDb = new Set(
    (
      await prisma.coupangCenterSeparation.findMany({
        where: { barcode: { in: dedupedBarcodes } },
        select: { barcode: true },
      })
    ).map((row) => row.barcode),
  );

  const { toCreate, existingBarcodes } = partitionKnownBarcodesByExisting(
    dedupedBarcodes,
    existingInDb,
  );

  const stats = {
    inputRows: barcodes.length,
    upserted: 0,
    created: 0,
    updated: 0,
    skippedEmptyBarcode,
    errors: [] as string[],
  };

  await prisma.$transaction(async (tx) => {
    for (const barcode of toCreate) {
      try {
        await tx.coupangCenterSeparation.create({
          data: { barcode },
        });

        stats.upserted += 1;
        stats.created += 1;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "센터분리 데이터 저장에 실패했습니다.";

        stats.errors.push(`바코드 ${barcode}: ${message}`);
      }
    }
  });

  if (stats.created === 0 && existingBarcodes.length === 0) {
    return {
      ok: false,
      error:
        stats.errors[0] ??
        "센터분리 데이터를 저장하지 못했습니다. 바코드를 확인해 주세요.",
      missingBarcodes,
      existingBarcodes,
    };
  }

  return {
    ok: true,
    data: { stats, missingBarcodes, existingBarcodes },
  };
}

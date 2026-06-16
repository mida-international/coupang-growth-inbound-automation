import { prisma } from "@/lib/db";
import type {
  OutboundDecomposeContext,
  OutboundPackageComponent,
} from "@/lib/deliverables/decompose-outbound-deduct-rows";
import { SHOPLING_DUMMY_BARCODE } from "@/lib/excel/targets/shopling-gross-outbound-template";

function isValidMappingBarcode(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 && trimmed !== SHOPLING_DUMMY_BARCODE;
}

export async function loadOutboundDecomposeContext(): Promise<OutboundDecomposeContext> {
  const { _max } = await prisma.shoplingInventory.aggregate({
    _max: { snapshotDate: true },
  });

  const maxSnapshotDate = _max.snapshotDate;
  const goodsTpByBarcode = new Map<string, string | null>();

  if (maxSnapshotDate) {
    const inventoryRows = await prisma.shoplingInventory.findMany({
      where: { snapshotDate: maxSnapshotDate },
      select: {
        barcode: true,
        goodsTp: true,
      },
    });

    for (const row of inventoryRows) {
      const barcode = row.barcode.trim();

      if (!barcode || goodsTpByBarcode.has(barcode)) {
        continue;
      }

      goodsTpByBarcode.set(barcode, row.goodsTp ?? null);
    }

    for (const row of inventoryRows) {
      const barcode = row.barcode.trim();

      if (!barcode || row.goodsTp !== "S") {
        continue;
      }

      goodsTpByBarcode.set(barcode, "S");
    }
  }

  const packageMappingsByBarcode = new Map<string, OutboundPackageComponent[]>();

  const mappingRows = await prisma.shoplingPackageMapping.findMany({
    select: {
      packageBarcode: true,
      singleBarcode: true,
      mapCnt: true,
    },
  });

  for (const row of mappingRows) {
    if (!isValidMappingBarcode(row.packageBarcode)) {
      continue;
    }

    if (!isValidMappingBarcode(row.singleBarcode)) {
      continue;
    }

    const packageBarcode = row.packageBarcode.trim();
    const singleBarcode = row.singleBarcode.trim();
    const mapCnt = row.mapCnt ?? 1;

    if (mapCnt <= 0) {
      continue;
    }

    const components = packageMappingsByBarcode.get(packageBarcode) ?? [];
    components.push({ singleBarcode, mapCnt });
    packageMappingsByBarcode.set(packageBarcode, components);
  }

  return {
    goodsTpByBarcode,
    packageMappingsByBarcode,
  };
}

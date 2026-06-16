import { isExcludedOutboundBarcode } from "@/lib/deliverables/normalize-outbound-box-items";
import type {
  DecomposeOutboundStats,
  OutboundDeductRow,
} from "@/services/deliverables/types";

export type OutboundPackageComponent = {
  singleBarcode: string;
  mapCnt: number;
};

export type OutboundDecomposeContext = {
  goodsTpByBarcode: Map<string, string | null>;
  packageMappingsByBarcode: Map<string, OutboundPackageComponent[]>;
};

export type DecomposeOutboundDeductRowsResult = {
  rows: OutboundDeductRow[];
  stats: Pick<
    DecomposeOutboundStats,
    "inputBarcodes" | "outputRows" | "packagesDecomposed" | "skippedUnmappedPackages"
  >;
};

function addDeductQty(
  deductByBarcode: Map<string, number>,
  barcode: string,
  qty: number,
) {
  if (qty <= 0) {
    return;
  }

  deductByBarcode.set(barcode, (deductByBarcode.get(barcode) ?? 0) + qty);
}

export function decomposeOutboundDeductRows(
  qtyByBarcode: Map<string, number>,
  context: OutboundDecomposeContext,
): DecomposeOutboundDeductRowsResult {
  const deductByBarcode = new Map<string, number>();
  const skippedUnmappedPackages: string[] = [];
  let packagesDecomposed = 0;

  for (const [barcode, boxQty] of qtyByBarcode) {
    if (boxQty <= 0) {
      continue;
    }

    const goodsTp = context.goodsTpByBarcode.get(barcode) ?? null;
    const isPackage = goodsTp === "S";

    if (isPackage) {
      const components = context.packageMappingsByBarcode.get(barcode);

      if (!components?.length) {
        skippedUnmappedPackages.push(barcode);
        continue;
      }

      packagesDecomposed += 1;

      for (const component of components) {
        if (component.mapCnt <= 0 || isExcludedOutboundBarcode(component.singleBarcode)) {
          continue;
        }

        addDeductQty(
          deductByBarcode,
          component.singleBarcode,
          boxQty * component.mapCnt,
        );
      }

      continue;
    }

    addDeductQty(deductByBarcode, barcode, boxQty);
  }

  const rows = Array.from(deductByBarcode.entries())
    .filter(([, deductQty]) => deductQty > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([barcode, deductQty]) => ({ barcode, deductQty }));

  return {
    rows,
    stats: {
      inputBarcodes: qtyByBarcode.size,
      outputRows: rows.length,
      packagesDecomposed,
      skippedUnmappedPackages,
    },
  };
}

import type { OutboundPackageComponent } from "@/lib/deliverables/decompose-outbound-deduct-rows";

export function resolveWarehouseInboundRotationQuantity(
  productBarcode: string | null,
  qtyByBarcode: Map<string, number>,
  packageMappingsByBarcode: Map<string, OutboundPackageComponent[]>,
): number | null {
  const barcode = productBarcode?.trim() ?? "";

  if (barcode.length === 0) {
    return null;
  }

  const components = packageMappingsByBarcode.get(barcode);

  if (components?.length) {
    let sum = 0;
    let found = false;

    for (const component of components) {
      const singleBarcode = component.singleBarcode.trim();
      const quantity = qtyByBarcode.get(singleBarcode);

      if (quantity !== undefined) {
        sum += quantity;
        found = true;
      }
    }

    return found ? sum : null;
  }

  const directQuantity = qtyByBarcode.get(barcode);

  if (directQuantity === undefined) {
    return null;
  }

  return directQuantity;
}

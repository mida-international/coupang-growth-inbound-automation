import type { OutboundDeductRow } from "@/services/deliverables/types";

export type AggregatedOutboundDeductRow = {
  barcode: string;
  quantity: number;
};

export function aggregateOutboundDeductRows(
  rows: OutboundDeductRow[],
): AggregatedOutboundDeductRow[] {
  const byBarcode = new Map<string, AggregatedOutboundDeductRow>();

  for (const row of rows) {
    if (row.deductQty <= 0) {
      continue;
    }

    const barcode = row.barcode.trim();

    if (barcode.length === 0) {
      continue;
    }

    const existing = byBarcode.get(barcode);

    if (existing) {
      existing.quantity += row.deductQty;
      continue;
    }

    byBarcode.set(barcode, {
      barcode,
      quantity: row.deductQty,
    });
  }

  return Array.from(byBarcode.values());
}

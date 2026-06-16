import {
  EMPTY_INBOUND_ROTATION_STATS,
  type InboundRecordEvent,
  type InboundRotationStats,
} from "@/lib/inbound/types";

export function toKstDateKey(recordedAt: Date): string {
  return recordedAt.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export function computeInboundRotationsForBarcode(
  events: InboundRecordEvent[],
): InboundRotationStats {
  const qtyByDate = new Map<string, number>();

  for (const event of events) {
    if (event.quantity <= 0) {
      continue;
    }

    const dateKey = toKstDateKey(event.recordedAt);
    qtyByDate.set(dateKey, (qtyByDate.get(dateKey) ?? 0) + event.quantity);
  }

  const rankedDates = Array.from(qtyByDate.entries()).sort(([left], [right]) =>
    right.localeCompare(left),
  );

  if (rankedDates.length === 0) {
    return { ...EMPTY_INBOUND_ROTATION_STATS };
  }

  const [date1, qty1] = rankedDates[0] ?? [];
  const [date2, qty2] = rankedDates[1] ?? [];
  const [date3, qty3] = rankedDates[2] ?? [];

  return {
    rotation1Qty: qty1 ?? null,
    rotation2Qty: qty2 ?? null,
    rotation3Qty: qty3 ?? null,
    rotation1Date: date1 ?? null,
    rotation2Date: date2 ?? null,
    rotation3Date: date3 ?? null,
  };
}

export function computeInboundRotationsByBarcode(
  events: InboundRecordEvent[],
): Map<string, InboundRotationStats> {
  const byBarcode = new Map<string, InboundRecordEvent[]>();

  for (const event of events) {
    const barcode = event.productBarcode.trim();

    if (barcode.length === 0) {
      continue;
    }

    const group = byBarcode.get(barcode) ?? [];
    group.push({ ...event, productBarcode: barcode });
    byBarcode.set(barcode, group);
  }

  const result = new Map<string, InboundRotationStats>();

  for (const [barcode, barcodeEvents] of byBarcode) {
    result.set(barcode, computeInboundRotationsForBarcode(barcodeEvents));
  }

  return result;
}

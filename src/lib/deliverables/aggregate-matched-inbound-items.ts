import type {
  AggregatedInboundRecordItem,
  MatchedInboundTemplateItem,
} from "@/services/deliverables/types";

export function aggregateMatchedInboundItems(
  items: MatchedInboundTemplateItem[],
): AggregatedInboundRecordItem[] {
  const byBarcode = new Map<string, AggregatedInboundRecordItem>();

  for (const item of items) {
    if (item.quantity <= 0) {
      continue;
    }

    const productBarcode = item.productBarcode.trim();

    if (productBarcode.length === 0) {
      continue;
    }

    const existing = byBarcode.get(productBarcode);
    const optionId = item.coupangOptionId.trim();

    if (existing) {
      existing.quantity += item.quantity;

      if (!existing.coupangOptionId && optionId) {
        existing.coupangOptionId = optionId;
      }

      continue;
    }

    byBarcode.set(productBarcode, {
      productBarcode,
      coupangOptionId: optionId || null,
      quantity: item.quantity,
    });
  }

  return Array.from(byBarcode.values());
}

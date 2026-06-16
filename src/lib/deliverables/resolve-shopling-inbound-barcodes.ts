import { isExcludedOutboundBarcode } from "@/lib/deliverables/normalize-outbound-box-items";
import {
  buildShoplingInboundLookupKey,
  normalizeShoplingInboundProductLabel,
} from "@/lib/deliverables/normalize-shopling-inbound-option";
import type { ShoplingInboundListItem } from "@/lib/excel/parsers/parse-shopling-inbound-list";
import type { OutboundDeductRow } from "@/services/deliverables/types";

export type ShoplingInboundInventoryRow = {
  ptnGoodsCd: string | null;
  productName: string | null;
  optionValue: string | null;
  barcode: string;
};

export type ShoplingInboundLookupIssue = {
  ptnGoodsCd: string;
  optionValue: string;
};

export type ResolveShoplingInboundBarcodesResult = {
  rows: OutboundDeductRow[];
  unmapped: ShoplingInboundLookupIssue[];
  ambiguous: ShoplingInboundLookupIssue[];
  skippedDummy: number;
};

function formatLookupIssue(item: ShoplingInboundListItem): ShoplingInboundLookupIssue {
  return {
    ptnGoodsCd: item.ptnGoodsCd,
    optionValue: item.optionValue,
  };
}

function formatIssueLabel(issue: ShoplingInboundLookupIssue): string {
  const optionSuffix = issue.optionValue ? ` / ${issue.optionValue}` : "";

  return `${issue.ptnGoodsCd}${optionSuffix}`;
}

export function formatShoplingInboundLookupError(
  result: Pick<ResolveShoplingInboundBarcodesResult, "unmapped" | "ambiguous">,
  previewCount = 5,
): string | null {
  if (result.unmapped.length === 0 && result.ambiguous.length === 0) {
    return null;
  }

  const parts: string[] = [];

  if (result.unmapped.length > 0) {
    const preview = result.unmapped
      .slice(0, previewCount)
      .map(formatIssueLabel)
      .join(", ");

    parts.push(`미매핑 ${result.unmapped.length}건 (${preview})`);
  }

  if (result.ambiguous.length > 0) {
    const preview = result.ambiguous
      .slice(0, previewCount)
      .map(formatIssueLabel)
      .join(", ");

    parts.push(`모호한 매칭 ${result.ambiguous.length}건 (${preview})`);
  }

  return `샵플링 바코드를 찾지 못했습니다. ${parts.join(" · ")}`;
}

function addBarcodeToIndex(
  index: Map<string, Set<string>>,
  productLabel: string | null | undefined,
  optionValue: string | null | undefined,
  barcode: string,
) {
  const label = normalizeShoplingInboundProductLabel(productLabel ?? "");

  if (!label) {
    return;
  }

  const key = buildShoplingInboundLookupKey(label, optionValue ?? "");
  const existing = index.get(key) ?? new Set<string>();
  existing.add(barcode);
  index.set(key, existing);
}

export function buildShoplingInboundBarcodeIndex(
  inventoryRows: ShoplingInboundInventoryRow[],
): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();

  for (const row of inventoryRows) {
    const barcode = row.barcode.trim();

    if (!barcode || isExcludedOutboundBarcode(barcode)) {
      continue;
    }

    addBarcodeToIndex(index, row.ptnGoodsCd, row.optionValue, barcode);
    addBarcodeToIndex(index, row.productName, row.optionValue, barcode);
  }

  return index;
}

export function resolveShoplingInboundBarcodes(
  items: ShoplingInboundListItem[],
  inventoryRows: ShoplingInboundInventoryRow[],
): ResolveShoplingInboundBarcodesResult {
  const barcodesByKey = buildShoplingInboundBarcodeIndex(inventoryRows);
  const qtyByBarcode = new Map<string, number>();
  const unmapped: ShoplingInboundLookupIssue[] = [];
  const ambiguous: ShoplingInboundLookupIssue[] = [];
  let skippedDummy = 0;

  for (const item of items) {
    const key = buildShoplingInboundLookupKey(item.ptnGoodsCd, item.optionValue);
    const barcodes = barcodesByKey.get(key);

    if (!barcodes || barcodes.size === 0) {
      unmapped.push(formatLookupIssue(item));
      continue;
    }

    if (barcodes.size > 1) {
      ambiguous.push(formatLookupIssue(item));
      continue;
    }

    const barcode = Array.from(barcodes)[0];

    if (isExcludedOutboundBarcode(barcode)) {
      skippedDummy += 1;
      continue;
    }

    qtyByBarcode.set(
      barcode,
      (qtyByBarcode.get(barcode) ?? 0) + item.quantity,
    );
  }

  const rows = Array.from(qtyByBarcode.entries())
    .filter(([, deductQty]) => deductQty > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([barcode, deductQty]) => ({ barcode, deductQty }));

  return {
    rows,
    unmapped,
    ambiguous,
    skippedDummy,
  };
}

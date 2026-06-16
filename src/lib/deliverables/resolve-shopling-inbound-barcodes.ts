import { isExcludedOutboundBarcode } from "@/lib/deliverables/normalize-outbound-box-items";
import {
  compareShoplingInboundOptions,
  normalizeShoplingInboundProductLabel,
  type ShoplingInboundOptionMatchTier,
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

const OPTION_MATCH_TIERS: ShoplingInboundOptionMatchTier[] = [
  "exact",
  "ignoreWhitespace",
  "ignoreCase",
];

type OptionMatchResult =
  | { status: "matched"; barcode: string }
  | { status: "ambiguous" }
  | { status: "unmapped" };

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

function productLabelMatches(
  inboundLabel: string,
  row: ShoplingInboundInventoryRow,
): boolean {
  const normalized = normalizeShoplingInboundProductLabel(inboundLabel);

  if (!normalized) {
    return false;
  }

  const ptnGoodsCd = normalizeShoplingInboundProductLabel(row.ptnGoodsCd ?? "");
  const productName = normalizeShoplingInboundProductLabel(row.productName ?? "");

  return normalized === ptnGoodsCd || normalized === productName;
}

export function filterInventoryByProductLabel(
  productLabel: string,
  inventoryRows: ShoplingInboundInventoryRow[],
): ShoplingInboundInventoryRow[] {
  return inventoryRows.filter((row) => productLabelMatches(productLabel, row));
}

export function findBarcodesByOptionCascade(
  candidates: ShoplingInboundInventoryRow[],
  inboundOption: string,
): OptionMatchResult {
  for (const tier of OPTION_MATCH_TIERS) {
    const barcodes = new Set<string>();

    for (const row of candidates) {
      if (
        !compareShoplingInboundOptions(
          inboundOption,
          row.optionValue ?? "",
          tier,
        )
      ) {
        continue;
      }

      const barcode = row.barcode.trim();

      if (!barcode || isExcludedOutboundBarcode(barcode)) {
        continue;
      }

      barcodes.add(barcode);
    }

    if (barcodes.size === 1) {
      return { status: "matched", barcode: Array.from(barcodes)[0]! };
    }

    if (barcodes.size > 1) {
      return { status: "ambiguous" };
    }
  }

  return { status: "unmapped" };
}

export function resolveShoplingInboundBarcodes(
  items: ShoplingInboundListItem[],
  inventoryRows: ShoplingInboundInventoryRow[],
): ResolveShoplingInboundBarcodesResult {
  const qtyByBarcode = new Map<string, number>();
  const unmapped: ShoplingInboundLookupIssue[] = [];
  const ambiguous: ShoplingInboundLookupIssue[] = [];
  let skippedDummy = 0;

  for (const item of items) {
    const candidates = filterInventoryByProductLabel(
      item.ptnGoodsCd,
      inventoryRows,
    );

    if (candidates.length === 0) {
      unmapped.push(formatLookupIssue(item));
      continue;
    }

    const match = findBarcodesByOptionCascade(candidates, item.optionValue);

    if (match.status === "unmapped") {
      unmapped.push(formatLookupIssue(item));
      continue;
    }

    if (match.status === "ambiguous") {
      ambiguous.push(formatLookupIssue(item));
      continue;
    }

    if (isExcludedOutboundBarcode(match.barcode)) {
      skippedDummy += 1;
      continue;
    }

    qtyByBarcode.set(
      match.barcode,
      (qtyByBarcode.get(match.barcode) ?? 0) + item.quantity,
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

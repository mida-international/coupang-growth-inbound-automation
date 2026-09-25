import { isExcludedOutboundBarcode } from "@/lib/deliverables/normalize-outbound-box-items";
import {
  compareShoplingInboundOptions,
  normalizeShoplingInboundProductLabelForTier,
  type ShoplingInboundOptionMatchTier,
} from "@/lib/deliverables/normalize-shopling-inbound-option";
import type { ShoplingInboundListItem } from "@/lib/excel/parsers/parse-shopling-inbound-list";
import type {
  OutboundDeductRow,
  ShoplingInboundValidationRow,
} from "@/services/deliverables/types";

export type ShoplingInboundInventoryRow = {
  ptnGoodsCd: string | null;
  productName: string | null;
  optionValue: string | null;
  barcode: string;
  location?: string | null;
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
  validation: ShoplingInboundValidationRow[];
};

const OPTION_MATCH_TIERS: ShoplingInboundOptionMatchTier[] = [
  "exact",
  "ignoreWhitespace",
  "ignoreCase",
];

// 품명(D열)도 옵션과 동일한 순서로 점점 느슨하게 후보를 넓힌다.
const PRODUCT_MATCH_TIERS: ShoplingInboundOptionMatchTier[] = [
  "exact",
  "ignoreWhitespace",
  "ignoreCase",
];

type OptionMatchResult =
  | { status: "matched"; barcode: string }
  | { status: "ambiguous" }
  | { status: "unmapped" };

export type ShoplingInboundInventoryMatchResult =
  | { status: "matched"; barcode: string; location: string | null }
  | { status: "ambiguous" }
  | { status: "unmapped" }
  | { status: "skippedDummy" };

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
  tier: ShoplingInboundOptionMatchTier,
): boolean {
  const normalized = normalizeShoplingInboundProductLabelForTier(
    inboundLabel,
    tier,
  );

  if (!normalized) {
    return false;
  }

  const ptnGoodsCd = normalizeShoplingInboundProductLabelForTier(
    row.ptnGoodsCd ?? "",
    tier,
  );
  const productName = normalizeShoplingInboundProductLabelForTier(
    row.productName ?? "",
    tier,
  );

  return normalized === ptnGoodsCd || normalized === productName;
}

export function filterInventoryByProductLabel(
  productLabel: string,
  inventoryRows: ShoplingInboundInventoryRow[],
  tier: ShoplingInboundOptionMatchTier = "exact",
): ShoplingInboundInventoryRow[] {
  return inventoryRows.filter((row) =>
    productLabelMatches(productLabel, row, tier),
  );
}

export function findInventoryMatchByOptionCascade(
  candidates: ShoplingInboundInventoryRow[],
  inboundOption: string,
): ShoplingInboundInventoryMatchResult {
  for (const tier of OPTION_MATCH_TIERS) {
    const matchedRows: ShoplingInboundInventoryRow[] = [];

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

      matchedRows.push(row);
    }

    const barcodes = new Set(matchedRows.map((row) => row.barcode.trim()));

    if (barcodes.size === 1) {
      const barcode = Array.from(barcodes)[0]!;
      const matchedRow = matchedRows.find(
        (row) => row.barcode.trim() === barcode,
      )!;
      const location = matchedRow.location?.trim() || null;

      return { status: "matched", barcode, location };
    }

    if (barcodes.size > 1) {
      return { status: "ambiguous" };
    }
  }

  return { status: "unmapped" };
}

export function findBarcodesByOptionCascade(
  candidates: ShoplingInboundInventoryRow[],
  inboundOption: string,
): OptionMatchResult {
  const match = findInventoryMatchByOptionCascade(candidates, inboundOption);

  if (match.status === "matched") {
    return { status: "matched", barcode: match.barcode };
  }

  if (match.status === "ambiguous") {
    return { status: "ambiguous" };
  }

  return { status: "unmapped" };
}

export function matchShoplingInboundInventoryRow(
  productLabel: string,
  optionValue: string,
  inventoryRows: ShoplingInboundInventoryRow[],
): ShoplingInboundInventoryMatchResult {
  // 품명을 exact → ignoreWhitespace → ignoreCase 순으로 넓혀가며 후보를 찾고,
  // 각 티어에서 옵션 캐스케이드로 바코드를 확정한다. 엄격한 티어를 먼저 확정해
  // "정확히 같은 품명"이 우선되도록 하고, 옵션이 안 맞으면(unmapped) 더 느슨한
  // 품명 티어로 내려가 재시도한다. 모호(ambiguous)는 그 티어의 실제 충돌이므로
  // 즉시 반환한다.
  for (const productTier of PRODUCT_MATCH_TIERS) {
    const candidates = filterInventoryByProductLabel(
      productLabel,
      inventoryRows,
      productTier,
    );

    if (candidates.length === 0) {
      continue;
    }

    const match = findInventoryMatchByOptionCascade(candidates, optionValue);

    if (match.status === "unmapped") {
      continue;
    }

    if (match.status === "matched" && isExcludedOutboundBarcode(match.barcode)) {
      return { status: "skippedDummy" };
    }

    return match;
  }

  return { status: "unmapped" };
}

export function resolveShoplingInboundBarcodes(
  items: ShoplingInboundListItem[],
  inventoryRows: ShoplingInboundInventoryRow[],
): ResolveShoplingInboundBarcodesResult {
  const rows: OutboundDeductRow[] = [];
  const unmapped: ShoplingInboundLookupIssue[] = [];
  const ambiguous: ShoplingInboundLookupIssue[] = [];
  const validation: ShoplingInboundValidationRow[] = [];
  let skippedDummy = 0;

  for (const item of items) {
    const match = matchShoplingInboundInventoryRow(
      item.ptnGoodsCd,
      item.optionValue,
      inventoryRows,
    );

    validation.push({
      ptnGoodsCd: item.ptnGoodsCd,
      optionValue: item.optionValue,
      quantity: item.quantity,
      status: match.status,
      barcode: match.status === "matched" ? match.barcode : null,
    });

    if (match.status === "unmapped") {
      unmapped.push(formatLookupIssue(item));
      continue;
    }

    if (match.status === "ambiguous") {
      ambiguous.push(formatLookupIssue(item));
      continue;
    }

    if (match.status === "skippedDummy") {
      skippedDummy += 1;
      continue;
    }

    // 수량 0 행은 바코드 검증까지만 하고 WMS 출력/기록 대상에는 넣지 않는다.
    if (item.quantity <= 0) {
      continue;
    }

    rows.push({
      barcode: match.barcode,
      deductQty: item.quantity,
    });
  }

  return {
    rows,
    unmapped,
    ambiguous,
    skippedDummy,
    validation,
  };
}

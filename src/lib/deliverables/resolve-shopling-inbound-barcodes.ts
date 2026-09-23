import { isExcludedOutboundBarcode } from "@/lib/deliverables/normalize-outbound-box-items";
import {
  compareShoplingInboundOptions,
  normalizeShoplingInboundOptionForTier,
  normalizeShoplingInboundProductLabel,
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

type OptionMatchResult =
  | { status: "matched"; barcode: string }
  | { status: "ambiguous" }
  | { status: "unmapped" };

export type ShoplingInboundUnmappedReason = "productNotFound" | "optionNotFound";

export type ShoplingInboundInventoryMatchResult =
  | { status: "matched"; barcode: string; location: string | null }
  | { status: "ambiguous" }
  | {
      status: "unmapped";
      reason: ShoplingInboundUnmappedReason;
      /** 상품은 찾았지만 옵션이 안 맞을 때, 그 상품의 샵플링 옵션 목록 */
      candidateOptions: string[];
    }
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

type ProductMatchTier = "exact" | "ignoreWhitespace" | "ignoreCase";

// 옵션과 같은 규칙으로 상품명도 공백 → 대소문자 차이만 봐준다 (그 이상은 오매칭 위험).
const PRODUCT_MATCH_TIERS: ProductMatchTier[] = ["exact", "ignoreWhitespace", "ignoreCase"];

function normalizeProductForTier(value: string, tier: ProductMatchTier): string {
  return tier === "exact"
    ? normalizeShoplingInboundProductLabel(value)
    : normalizeShoplingInboundOptionForTier(value, tier);
}

function productLabelMatches(
  inboundLabel: string,
  row: ShoplingInboundInventoryRow,
  tier: ProductMatchTier = "exact",
): boolean {
  const normalized = normalizeProductForTier(inboundLabel, tier);

  if (!normalized) {
    return false;
  }

  return (
    normalized === normalizeProductForTier(row.ptnGoodsCd ?? "", tier) ||
    normalized === normalizeProductForTier(row.productName ?? "", tier)
  );
}

export function filterInventoryByProductLabel(
  productLabel: string,
  inventoryRows: ShoplingInboundInventoryRow[],
  tier: ProductMatchTier = "exact",
): ShoplingInboundInventoryRow[] {
  return inventoryRows.filter((row) => productLabelMatches(productLabel, row, tier));
}

function isUsableRow(row: ShoplingInboundInventoryRow): boolean {
  const barcode = row.barcode.trim();
  return Boolean(barcode) && !isExcludedOutboundBarcode(barcode);
}

export function findInventoryMatchByOptionCascade(
  candidates: ShoplingInboundInventoryRow[],
  inboundOption: string,
): ShoplingInboundInventoryMatchResult {
  for (const tier of OPTION_MATCH_TIERS) {
    const matchedRows = candidates.filter(
      (row) =>
        isUsableRow(row) &&
        compareShoplingInboundOptions(inboundOption, row.optionValue ?? "", tier),
    );

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

  return {
    status: "unmapped",
    reason: "optionNotFound",
    candidateOptions: listCandidateOptions(candidates),
  };
}

function listCandidateOptions(candidates: ShoplingInboundInventoryRow[]): string[] {
  return Array.from(
    new Set(
      candidates
        .filter(isUsableRow)
        .map((row) => (row.optionValue ?? "").trim())
        .filter(Boolean),
    ),
  );
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

/**
 * 상품 → 옵션 순서로 찾는다. 둘 다 완전 일치 → 공백 무시 → 대소문자 무시 순서.
 * 앞 단계에서 찾으면 뒤 단계는 보지 않으므로 기존에 맞던 행의 결과는 바뀌지 않는다.
 */
export function matchShoplingInboundInventoryRow(
  productLabel: string,
  optionValue: string,
  inventoryRows: ShoplingInboundInventoryRow[],
): ShoplingInboundInventoryMatchResult {
  let firstOptionMiss: ShoplingInboundInventoryMatchResult | null = null;
  const triedCandidates = new Set<ShoplingInboundInventoryRow>();

  for (const tier of PRODUCT_MATCH_TIERS) {
    const candidates = filterInventoryByProductLabel(productLabel, inventoryRows, tier);
    const hasNewCandidates = candidates.some((row) => !triedCandidates.has(row));

    if (candidates.length === 0 || !hasNewCandidates) {
      continue;
    }

    candidates.forEach((row) => triedCandidates.add(row));

    const match = findInventoryMatchByOptionCascade(candidates, optionValue);

    if (match.status === "ambiguous") {
      return match;
    }

    if (match.status === "matched") {
      if (isExcludedOutboundBarcode(match.barcode)) {
        return { status: "skippedDummy" };
      }

      return match;
    }

    firstOptionMiss ??= match;
  }

  return (
    firstOptionMiss ?? {
      status: "unmapped",
      reason: "productNotFound",
      candidateOptions: [],
    }
  );
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
      ...(match.status === "unmapped"
        ? { unmappedReason: match.reason, candidateOptions: match.candidateOptions }
        : {}),
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

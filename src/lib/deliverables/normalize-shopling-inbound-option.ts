export type ShoplingInboundOptionMatchTier =
  | "exact"
  | "ignoreWhitespace"
  | "ignoreCase"
  | "ignorePunctuation"
  | "contains";

/** 사람이 확인해야 하는(추정) 옵션 단계 */
export const ESTIMATED_OPTION_TIERS: ReadonlySet<ShoplingInboundOptionMatchTier> =
  new Set(["ignorePunctuation", "contains"]);

const MIN_CONTAINS_LENGTH = 2;

/**
 * 공백·대소문자·기호(-, _, (), +, / 등)를 모두 무시한 비교용 값.
 * 전각 문자는 NFKC 로 반각으로 맞춘다.
 */
export function normalizeShoplingInboundLoose(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function normalizeShoplingInboundOptionExact(value: string): string {
  return value
    .trim()
    .replaceAll("，", ",")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ");
}

export function normalizeShoplingInboundOption(value: string): string {
  return normalizeShoplingInboundOptionExact(value);
}

export function normalizeShoplingInboundOptionIgnoreWhitespace(
  value: string,
): string {
  return normalizeShoplingInboundOptionExact(value).replace(/\s+/g, "");
}

export function normalizeShoplingInboundOptionIgnoreCase(value: string): string {
  return normalizeShoplingInboundOptionIgnoreWhitespace(value).toLowerCase();
}

export function normalizeShoplingInboundOptionForTier(
  value: string,
  tier: ShoplingInboundOptionMatchTier,
): string {
  switch (tier) {
    case "exact":
      return normalizeShoplingInboundOptionExact(value);
    case "ignoreWhitespace":
      return normalizeShoplingInboundOptionIgnoreWhitespace(value);
    case "ignoreCase":
      return normalizeShoplingInboundOptionIgnoreCase(value);
    case "ignorePunctuation":
    case "contains":
      return normalizeShoplingInboundLoose(value);
  }
}

export function compareShoplingInboundOptions(
  left: string,
  right: string,
  tier: ShoplingInboundOptionMatchTier,
): boolean {
  const normalizedLeft = normalizeShoplingInboundOptionForTier(left, tier);
  const normalizedRight = normalizeShoplingInboundOptionForTier(right, tier);

  if (tier === "contains") {
    // 예: "1개 뚜껑있음18칸" ⊃ "뚜껑있음18칸", "검정-옵션추가" ⊃ "검정"
    // 한 글자 옵션("S", "소")은 엉뚱한 옵션에 포함되기 쉬워 제외한다.
    return (
      Math.min(normalizedLeft.length, normalizedRight.length) >=
        MIN_CONTAINS_LENGTH &&
      (normalizedLeft.includes(normalizedRight) ||
        normalizedRight.includes(normalizedLeft))
    );
  }

  return normalizedLeft === normalizedRight;
}

export function normalizeShoplingInboundProductLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * 상품명 기본형: 첫 "_" 앞부분만 느슨하게 비교한다.
 * 예: "볼륨헤어핀2p_RM" → "볼륨헤어핀2p", "발란스신발끈_세트구성_2p" → "발란스신발끈"
 */
export function normalizeShoplingInboundProductBase(value: string): string {
  return normalizeShoplingInboundLoose(value.split("_")[0] ?? "");
}

/** @deprecated Use normalizeShoplingInboundProductLabel */
export function normalizeShoplingInboundPtnGoodsCd(value: string): string {
  return normalizeShoplingInboundProductLabel(value);
}

export function buildShoplingInboundLookupKey(
  productLabel: string,
  optionValue: string,
): string {
  return `${normalizeShoplingInboundProductLabel(productLabel)}\0${normalizeShoplingInboundOption(optionValue)}`;
}

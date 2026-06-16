export type ShoplingInboundOptionMatchTier =
  | "exact"
  | "ignoreWhitespace"
  | "ignoreCase";

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
  }
}

export function compareShoplingInboundOptions(
  left: string,
  right: string,
  tier: ShoplingInboundOptionMatchTier,
): boolean {
  return (
    normalizeShoplingInboundOptionForTier(left, tier) ===
    normalizeShoplingInboundOptionForTier(right, tier)
  );
}

export function normalizeShoplingInboundProductLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
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

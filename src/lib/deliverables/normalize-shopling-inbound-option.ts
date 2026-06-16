export function normalizeShoplingInboundOption(value: string): string {
  return value
    .trim()
    .replaceAll("，", ",")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ");
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

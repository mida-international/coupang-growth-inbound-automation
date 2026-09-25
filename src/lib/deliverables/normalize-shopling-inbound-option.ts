export type ShoplingInboundOptionMatchTier =
  | "exact"
  | "ignoreWhitespace"
  | "ignoreCase";

// 폭 0/방향·서식 제어용 유니코드 문자 범위. \s·trim()으로는 제거되지 않아 눈에
// 보이지 않는 채로 남아 품명·옵션 매칭을 조용히 깨뜨리므로 매칭 전에 먼저 제거한다.
const INVISIBLE_CHAR_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x00ad, 0x00ad], // soft hyphen
  [0x180e, 0x180e], // mongolian vowel separator
  [0x200b, 0x200f], // ZWSP, ZWNJ, ZWJ, LRM, RLM
  [0x202a, 0x202e], // bidi embedding/override
  [0x2060, 0x206f], // word joiner 등 서식 제어 문자
  [0xfeff, 0xfeff], // BOM / ZWNBSP
];

function toHexEscape(codePoint: number): string {
  return `\\u${codePoint.toString(16).padStart(4, "0")}`;
}

const INVISIBLE_CHAR_PATTERN = new RegExp(
  `[${INVISIBLE_CHAR_RANGES.map(([start, end]) =>
    start === end
      ? toHexEscape(start)
      : `${toHexEscape(start)}-${toHexEscape(end)}`,
  ).join("")}]`,
  "g",
);

export function stripInvisibleCharacters(value: string): string {
  return value.replace(INVISIBLE_CHAR_PATTERN, "");
}

export function normalizeShoplingInboundOptionExact(value: string): string {
  return stripInvisibleCharacters(value)
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
  return stripInvisibleCharacters(value).trim().replace(/\s+/g, " ");
}

// 품명(D열)도 옵션과 동일한 관대함으로 조회할 수 있게 티어별 정규화를 제공한다.
// exact → ignoreWhitespace → ignoreCase 순으로 점점 느슨하게 후보를 넓힌다.
export function normalizeShoplingInboundProductLabelForTier(
  value: string,
  tier: ShoplingInboundOptionMatchTier,
): string {
  const base = normalizeShoplingInboundProductLabel(value);

  switch (tier) {
    case "exact":
      return base;
    case "ignoreWhitespace":
      return base.replace(/\s+/g, "");
    case "ignoreCase":
      return base.replace(/\s+/g, "").toLowerCase();
  }
}

export function compareShoplingInboundProductLabels(
  left: string,
  right: string,
  tier: ShoplingInboundOptionMatchTier,
): boolean {
  return (
    normalizeShoplingInboundProductLabelForTier(left, tier) ===
    normalizeShoplingInboundProductLabelForTier(right, tier)
  );
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

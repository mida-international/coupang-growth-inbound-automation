const MASK_PREFIX_LENGTH = 8;
const MASK_SUFFIX_LENGTH = 4;

export function maskApiKey(apiAuthKey: string): string {
  const trimmed = apiAuthKey.trim();

  if (trimmed.length === 0) {
    return "";
  }

  if (trimmed.length <= MASK_SUFFIX_LENGTH) {
    return "*".repeat(trimmed.length);
  }

  const suffix = trimmed.slice(-MASK_SUFFIX_LENGTH);
  const prefixMaskLength = Math.max(trimmed.length - MASK_SUFFIX_LENGTH, MASK_PREFIX_LENGTH);

  return `${"*".repeat(prefixMaskLength)}${suffix}`;
}

export function isMaskedApiKeyPlaceholder(
  value: string,
  existingKey: string,
): boolean {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return true;
  }

  return trimmed === maskApiKey(existingKey);
}

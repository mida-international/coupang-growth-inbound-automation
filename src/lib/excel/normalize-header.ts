export function normalizeHeader(value: unknown): string {
  if (value == null) {
    return "";
  }

  return String(value).replace(/\s+/g, " ").trim();
}

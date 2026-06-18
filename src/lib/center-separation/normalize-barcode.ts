export function normalizeCenterSeparationBarcode(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value)).replace(/\s/g, "");
  }

  return String(value).trim().replace(/\s/g, "");
}

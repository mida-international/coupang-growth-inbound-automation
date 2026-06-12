export function parseOptionalString(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  const text = String(value).trim();

  return text.length > 0 ? text : null;
}

export function parseOptionalInt(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const normalized = String(value).replace(/,/g, "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);

  return Number.isNaN(parsed) ? null : parsed;
}

export function parseOptionalBigInt(value: unknown): bigint | null {
  if (value == null || value === "") {
    return null;
  }

  const normalized = String(value).replace(/,/g, "").trim();

  if (!normalized) {
    return null;
  }

  try {
    return BigInt(normalized);
  } catch {
    return null;
  }
}

export function parseOptionalDecimal(value: unknown): string | null {
  if (value == null || value === "") {
    return null;
  }

  const normalized = String(value).replace(/,/g, "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isNaN(parsed) ? null : normalized;
}

export function parseOptionalDate(value: unknown): Date | null {
  if (value == null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    const parsed = new Date(
      `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00.000Z`,
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dottedMatch = text.match(/^(\d{4})\.(\d{2})\.(\d{2})/);

  if (dottedMatch) {
    const parsed = new Date(
      `${dottedMatch[1]}-${dottedMatch[2]}-${dottedMatch[3]}T00:00:00.000Z`,
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function parseOptionalBoolean(value: unknown): boolean | null {
  if (value == null || value === "") {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["y", "yes", "true", "1"].includes(normalized)) {
    return true;
  }

  if (["n", "no", "false", "0"].includes(normalized)) {
    return false;
  }

  return null;
}

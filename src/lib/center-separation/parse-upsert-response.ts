import type { ApiResult } from "@/lib/api/types";
import type { UpsertCenterSeparationResult } from "@/services/center-separation/types";

export type CenterSeparationUpsertApiResult =
  | { ok: true; data: UpsertCenterSeparationResult }
  | {
      ok: false;
      error: string;
      missingBarcodes: string[];
      existingBarcodes: string[];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function parseCenterSeparationUpsertResponse(
  parsed: unknown,
): CenterSeparationUpsertApiResult | null {
  if (!isRecord(parsed) || parsed.ok !== true && parsed.ok !== false) {
    return null;
  }

  if (parsed.ok === true && isRecord(parsed.data)) {
    const data = parsed.data as UpsertCenterSeparationResult;

    return {
      ok: true,
      data: {
        stats: data.stats,
        missingBarcodes: parseStringArray(data.missingBarcodes),
        existingBarcodes: parseStringArray(data.existingBarcodes),
      },
    };
  }

  if (parsed.ok === false && typeof parsed.error === "string") {
    return {
      ok: false,
      error: parsed.error,
      missingBarcodes: parseStringArray(parsed.missingBarcodes),
      existingBarcodes: parseStringArray(parsed.existingBarcodes),
    };
  }

  return null;
}

export async function readCenterSeparationUpsertResponse(
  response: Response,
): Promise<CenterSeparationUpsertApiResult> {
  let parsed: unknown;

  try {
    parsed = await response.json();
  } catch {
    return {
      ok: false,
      error: "응답을 처리할 수 없습니다.",
      missingBarcodes: [],
      existingBarcodes: [],
    };
  }

  const result = parseCenterSeparationUpsertResponse(parsed);

  if (result) {
    return result;
  }

  if (
    isRecord(parsed) &&
    parsed.ok === false &&
    typeof parsed.error === "string"
  ) {
    return {
      ok: false,
      error: parsed.error,
      missingBarcodes: [],
      existingBarcodes: [],
    };
  }

  return {
    ok: false,
    error: "응답을 처리할 수 없습니다.",
    missingBarcodes: [],
    existingBarcodes: [],
  };
}

export function toApiResult(
  result: CenterSeparationUpsertApiResult,
): ApiResult<UpsertCenterSeparationResult> {
  if (result.ok) {
    return { ok: true, data: result.data };
  }

  return { ok: false, error: result.error };
}

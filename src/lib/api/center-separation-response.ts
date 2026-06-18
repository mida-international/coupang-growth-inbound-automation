import { NextResponse } from "next/server";

import { jsonSuccess } from "@/lib/api/response";
import type { CenterSeparationServiceResult } from "@/services/center-separation/types";

export function fromCenterSeparationServiceResult<T>(
  result: CenterSeparationServiceResult<T>,
  options?: { successStatus?: number },
): NextResponse {
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false as const,
        error: result.error,
        missingBarcodes: result.missingBarcodes ?? [],
      },
      { status: 400 },
    );
  }

  return jsonSuccess(result.data, options?.successStatus ?? 200);
}

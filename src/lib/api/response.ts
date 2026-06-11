import { NextResponse } from "next/server";

import type { ApiResult } from "@/lib/api/types";

export function jsonSuccess<T>(
  data: T,
  status = 200
): NextResponse<ApiResult<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(
  error: string,
  status = 400
): NextResponse<ApiResult<never>> {
  return NextResponse.json({ ok: false, error }, { status });
}

export function fromServiceResult<T>(
  result: ApiResult<T>,
  options?: { successStatus?: number; errorStatus?: number }
): NextResponse<ApiResult<T>> {
  if (!result.ok) {
    return jsonError(result.error, options?.errorStatus ?? 400);
  }

  return jsonSuccess(result.data, options?.successStatus ?? 200);
}

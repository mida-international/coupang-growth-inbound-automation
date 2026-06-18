import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { fromCenterSeparationServiceResult } from "@/lib/api/center-separation-response";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import { createCenterSeparationBarcode } from "@/services/center-separation/create-center-separation-barcode";

type CreateCenterSeparationBody = {
  barcode?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    let body: CreateCenterSeparationBody;

    try {
      body = (await request.json()) as CreateCenterSeparationBody;
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

    const result = await createCenterSeparationBarcode(body.barcode ?? "");

    return fromCenterSeparationServiceResult(result, { successStatus: 201 });
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-growth/center-separation",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

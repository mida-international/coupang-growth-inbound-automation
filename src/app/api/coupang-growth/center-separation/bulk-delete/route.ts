import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { deleteCenterSeparationBarcodes } from "@/services/center-separation/delete-center-separation-barcodes";

type BulkDeleteCenterSeparationBody = {
  ids?: string[];
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    let body: BulkDeleteCenterSeparationBody;

    try {
      body = (await request.json()) as BulkDeleteCenterSeparationBody;
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

    const result = await deleteCenterSeparationBarcodes(body.ids ?? []);

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-growth/center-separation/bulk-delete",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

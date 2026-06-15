import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { createShoplingPackageMapping } from "@/services/shopling-package-mapping/create-shopling-package-mapping";
import type { CreateShoplingPackageMappingBody } from "@/services/shopling-package-mapping/types";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    let body: CreateShoplingPackageMappingBody;

    try {
      body = (await request.json()) as CreateShoplingPackageMappingBody;
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

    const result = await createShoplingPackageMapping(body);

    return fromServiceResult(result, { successStatus: 201 });
  } catch (error) {
    logRouteError(error, {
      route: "/api/shopling/package-mapping",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

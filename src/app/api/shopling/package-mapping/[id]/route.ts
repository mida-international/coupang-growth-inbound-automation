import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { deleteShoplingPackageMapping } from "@/services/shopling-package-mapping/delete-shopling-package-mapping";
import { updateShoplingPackageMapping } from "@/services/shopling-package-mapping/update-shopling-package-mapping";
import type { UpdateShoplingPackageMappingBody } from "@/services/shopling-package-mapping/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const { id } = await context.params;

    let body: UpdateShoplingPackageMappingBody;

    try {
      body = (await request.json()) as UpdateShoplingPackageMappingBody;
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

    const result = await updateShoplingPackageMapping(id, body);

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/shopling/package-mapping/[id]",
      method: "PATCH",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const { id } = await context.params;
    const result = await deleteShoplingPackageMapping(id);

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/shopling/package-mapping/[id]",
      method: "DELETE",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

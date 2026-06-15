import type { NextRequest } from "next/server";

import { requireApiMaster } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { getShoplingApiConfig } from "@/services/shopling-api-config/get-shopling-api-config";
import type { UpsertShoplingApiConfigInput } from "@/services/shopling-api-config/types";
import { upsertShoplingApiConfig } from "@/services/shopling-api-config/upsert-shopling-api-config";

export async function GET() {
  try {
    const auth = await requireApiMaster();

    if ("response" in auth) {
      return auth.response;
    }

    const result = await getShoplingApiConfig();

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/integrations/shopling",
      method: "GET",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireApiMaster();

    if ("response" in auth) {
      return auth.response;
    }

    let body: UpsertShoplingApiConfigInput;

    try {
      body = (await request.json()) as UpsertShoplingApiConfigInput;
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

    const result = await upsertShoplingApiConfig({
      ...body,
      updatedById: auth.profile.id,
    });

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/integrations/shopling",
      method: "PUT",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import {
  batchUpsertInboundPlanningOverrides,
  type BatchUpsertInboundPlanningOverridesInput,
} from "@/services/inbound-workbench/upsert-inbound-planning-overrides";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    let body: Omit<BatchUpsertInboundPlanningOverridesInput, "updatedById">;

    try {
      body =
        (await request.json()) as Omit<
          BatchUpsertInboundPlanningOverridesInput,
          "updatedById"
        >;
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

    const result = await batchUpsertInboundPlanningOverrides({
      ...body,
      updatedById: auth.profile.id,
    });

    if (!result.ok) {
      return jsonError(result.error, 400);
    }

    return fromServiceResult({ ok: true, data: undefined });
  } catch (error) {
    logRouteError(error, {
      route: "/api/inbound-workbench/overrides",
      method: "PATCH",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

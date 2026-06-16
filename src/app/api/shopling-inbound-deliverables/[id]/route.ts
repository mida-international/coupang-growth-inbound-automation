import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { deleteShoplingInboundDeliverable } from "@/services/deliverables/delete-shopling-inbound-deliverable";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const { id } = await context.params;
    const result = await deleteShoplingInboundDeliverable(id);

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/shopling-inbound-deliverables/[id]",
      method: "DELETE",
    });
    return jsonError("입고 기록 삭제에 실패했습니다.", 500);
  }
}

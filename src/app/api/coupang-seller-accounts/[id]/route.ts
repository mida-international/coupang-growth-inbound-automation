import type { NextRequest } from "next/server";

import { AUDIT_ACTIONS, logAudit } from "@/lib/audit";
import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { deleteSellerAccount } from "@/services/coupang-seller-accounts/delete-seller-account";

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
    const result = await deleteSellerAccount(id);

    if (result.ok) {
      await logAudit({
        actorId: auth.profile.id,
        action: AUDIT_ACTIONS.profileUpdate,
        targetType: "coupang_seller_account",
        targetId: result.data.id,
        metadata: {
          scope: "seller_account_delete",
          displayName: result.data.displayName,
        },
      });
    }

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-seller-accounts/[id]",
      method: "DELETE",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

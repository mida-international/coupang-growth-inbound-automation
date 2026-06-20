import type { NextRequest } from "next/server";

import { AUDIT_ACTIONS, logAudit } from "@/lib/audit";
import { requireApiMaster } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { deleteMember } from "@/services/members/delete-member";
import { updateMember } from "@/services/members/update-member";
import type { UpdateMemberInput } from "@/services/members/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiMaster();

    if ("response" in auth) {
      return auth.response;
    }

    const { id } = await context.params;

    let body: UpdateMemberInput;

    try {
      body = (await request.json()) as UpdateMemberInput;
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

    const result = await updateMember(id, body);

    if (result.ok) {
      await logAudit({
        actorId: auth.profile.id,
        action: AUDIT_ACTIONS.profileUpdate,
        targetType: "profile",
        targetId: result.data.id,
        metadata: {
          scope: "member_admin_update",
          email: result.data.email,
          role: result.data.role,
        },
      });
    }

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, { route: "/api/members/[id]", method: "PATCH" });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiMaster();

    if ("response" in auth) {
      return auth.response;
    }

    const { id } = await context.params;
    const result = await deleteMember(id, auth.profile.id);

    if (result.ok) {
      await logAudit({
        actorId: auth.profile.id,
        action: AUDIT_ACTIONS.profileUpdate,
        targetType: "profile",
        targetId: result.data.id,
        metadata: {
          scope: "member_admin_delete",
          email: result.data.email,
        },
      });
    }

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, { route: "/api/members/[id]", method: "DELETE" });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

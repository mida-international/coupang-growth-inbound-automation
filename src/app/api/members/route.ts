import type { NextRequest } from "next/server";

import { AUDIT_ACTIONS, logAudit } from "@/lib/audit";
import { requireApiMaster } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError, jsonSuccess } from "@/lib/api/response";
import { createAdmin } from "@/services/members/create-admin";
import type { CreateAdminInput } from "@/services/members/types";
import { listMembers } from "@/services/members/list-members";

export async function GET() {
  try {
    const auth = await requireApiMaster();

    if ("response" in auth) {
      return auth.response;
    }

    const members = await listMembers();

    return jsonSuccess(members);
  } catch (error) {
    logRouteError(error, { route: "/api/members", method: "GET" });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiMaster();

    if ("response" in auth) {
      return auth.response;
    }

    let body: CreateAdminInput;

    try {
      body = (await request.json()) as CreateAdminInput;
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

  const result = await createAdmin(body);

  if (result.ok) {
    await logAudit({
      actorId: auth.profile.id,
      action: AUDIT_ACTIONS.memberCreate,
      targetType: "profile",
      targetId: result.data.id,
      metadata: { email: result.data.email, role: result.data.role },
    });
  }

  return fromServiceResult(result, { successStatus: 201 });
} catch (error) {
    logRouteError(error, { route: "/api/members", method: "POST" });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

import type { NextRequest } from "next/server";

import { AUDIT_ACTIONS, logAudit } from "@/lib/audit";
import { requireApiProfile } from "@/lib/api/auth";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { changePassword } from "@/services/account/change-password";
import type { ChangePasswordInput } from "@/services/account/types";

export async function POST(request: NextRequest) {
  const auth = await requireApiProfile();

  if ("response" in auth) {
    return auth.response;
  }

  let body: ChangePasswordInput;

  try {
    body = (await request.json()) as ChangePasswordInput;
  } catch {
    return jsonError("요청 본문이 올바르지 않습니다.", 400);
  }

  const result = await changePassword(body);

  if (result.ok) {
    await logAudit({
      actorId: auth.profile.id,
      action: AUDIT_ACTIONS.passwordChange,
      targetType: "profile",
      targetId: auth.profile.id,
    });
  }

  return fromServiceResult(result);
}

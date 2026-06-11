import type { NextRequest } from "next/server";

import { requireApiMaster } from "@/lib/api/auth";
import { fromServiceResult, jsonError, jsonSuccess } from "@/lib/api/response";
import { createAdmin } from "@/services/members/create-admin";
import type { CreateAdminInput } from "@/services/members/types";
import { listMembers } from "@/services/members/list-members";

export async function GET() {
  const auth = await requireApiMaster();

  if ("response" in auth) {
    return auth.response;
  }

  const members = await listMembers();

  return jsonSuccess(members);
}

export async function POST(request: NextRequest) {
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

  return fromServiceResult(result, { successStatus: 201 });
}

import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { fromServiceResult, jsonError, jsonSuccess } from "@/lib/api/response";
import { getProfileView } from "@/lib/profile/get-profile-view";
import { updateProfileName } from "@/lib/profile/update-profile-name";
import type { UpdateProfileNameInput } from "@/lib/profile/types";

export async function GET() {
  const auth = await requireApiProfile();

  if ("response" in auth) {
    return auth.response;
  }

  const profileView = await getProfileView(auth.profile.id);

  if (!profileView) {
    return jsonError("프로필을 찾을 수 없습니다.", 404);
  }

  return jsonSuccess(profileView);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiProfile();

  if ("response" in auth) {
    return auth.response;
  }

  let body: UpdateProfileNameInput;

  try {
    body = (await request.json()) as UpdateProfileNameInput;
  } catch {
    return jsonError("요청 본문이 올바르지 않습니다.", 400);
  }

  const result = await updateProfileName(auth.profile.id, body);

  return fromServiceResult(result);
}

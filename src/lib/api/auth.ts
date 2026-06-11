import type { Profile } from "@/generated/prisma/client";
import type { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/profile";
import { jsonError } from "@/lib/api/response";

export type ApiAuthResult =
  | { profile: Profile }
  | { response: NextResponse };

export async function getApiProfile(): Promise<Profile | null> {
  return getCurrentProfile();
}

export async function requireApiProfile(): Promise<ApiAuthResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { response: jsonError("로그인이 필요합니다.", 401) };
  }

  return { profile };
}

export async function requireApiMaster(): Promise<ApiAuthResult> {
  const auth = await requireApiProfile();

  if ("response" in auth) {
    return auth;
  }

  if (auth.profile.role !== "master") {
    return { response: jsonError("권한이 없습니다.", 403) };
  }

  return auth;
}

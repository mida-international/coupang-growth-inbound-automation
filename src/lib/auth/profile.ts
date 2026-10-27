import { cache } from "react";
import { redirect } from "next/navigation";

import type { Profile, Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export type { Role };
export const ASSIGNABLE_ROLES = ["admin", "master"] as const satisfies readonly Role[];

// 한 요청 안에서 layout·page·컴포넌트가 각각 부르면 Supabase 인증 왕복 + Profile 조회가
// 그 수만큼 반복됐다. React cache()로 요청당 한 번만 실행한다 (2026-10-27).
export const getCurrentProfile = cache(
  async function getCurrentProfile(): Promise<Profile | null> {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return prisma.profile.findUnique({ where: { id: user.id } });
  },
);

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export async function requireMaster(): Promise<Profile> {
  const profile = await requireProfile();

  if (profile.role !== "master") {
    redirect("/");
  }

  return profile;
}

import { redirect } from "next/navigation";

import type { Profile, Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export type { Role };
export const ASSIGNABLE_ROLES = ["admin", "master"] as const satisfies readonly Role[];

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return prisma.profile.findUnique({ where: { id: user.id } });
}

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

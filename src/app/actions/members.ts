"use server";

import { revalidatePath } from "next/cache";

import { requireMaster } from "@/lib/auth/profile";
import { createAdmin as createAdminMember } from "@/lib/members/create-admin";
import type { CreateAdminInput } from "@/lib/members/types";

export type { CreateAdminInput };

export type CreateAdminResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createAdmin(
  input: CreateAdminInput
): Promise<CreateAdminResult> {
  await requireMaster();
  const result = await createAdminMember(input);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/settings/members");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";

import { changePassword } from "@/lib/account/change-password";
import type { ChangePasswordInput } from "@/lib/account/types";
import { requireProfile } from "@/lib/auth/profile";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function changePasswordAction(
  input: ChangePasswordInput
): Promise<ChangePasswordResult> {
  await requireProfile();
  const result = await changePassword(input);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/settings/accounts");
  return { ok: true };
}

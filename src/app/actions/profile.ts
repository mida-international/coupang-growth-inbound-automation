"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/profile";
import { updateProfileName } from "@/services/profile/update-profile-name";
import type { ProfileView, UpdateProfileNameInput } from "@/services/profile/types";

export type UpdateProfileResult =
  | { ok: true; data: ProfileView }
  | { ok: false; error: string };

export async function updateProfile(
  input: UpdateProfileNameInput
): Promise<UpdateProfileResult> {
  const profile = await requireProfile();
  const result = await updateProfileName(profile.id, input);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/settings/profile");
  return { ok: true, data: result.data };
}

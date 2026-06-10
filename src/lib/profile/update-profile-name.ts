import { z } from "zod";

import { prisma } from "@/lib/db";
import { getProfileView } from "@/lib/profile/get-profile-view";
import type {
  ProfileResult,
  ProfileView,
  UpdateProfileNameInput,
} from "@/lib/profile/types";

const updateProfileNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "이름을 입력해 주세요.")
    .max(50, "이름은 50자 이하여야 합니다."),
});

export async function updateProfileName(
  profileId: string,
  input: UpdateProfileNameInput
): Promise<ProfileResult<ProfileView>> {
  const parsed = updateProfileNameSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { ok: false, error: firstIssue };
  }

  const existing = await prisma.profile.findUnique({
    where: { id: profileId },
  });

  if (!existing) {
    return { ok: false, error: "프로필을 찾을 수 없습니다." };
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: { name: parsed.data.name },
  });

  const profileView = await getProfileView(profileId);

  if (!profileView) {
    return { ok: false, error: "프로필을 찾을 수 없습니다." };
  }

  return { ok: true, data: profileView };
}

import type { Profile } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import type { ProfileView } from "@/services/profile/types";

function toProfileView(profile: Profile): ProfileView {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
  };
}

export async function getProfileView(
  profileId: string
): Promise<ProfileView | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    return null;
  }

  return toProfileView(profile);
}

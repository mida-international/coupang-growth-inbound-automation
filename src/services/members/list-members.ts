import type { Profile } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function listMembers(): Promise<Profile[]> {
  return prisma.profile.findMany({
    orderBy: { email: "asc" },
  });
}

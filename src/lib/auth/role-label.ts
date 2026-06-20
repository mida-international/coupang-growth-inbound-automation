import type { Role } from "@/generated/prisma/client";

export function getRoleLabel(role: Role): string {
  return role === "master" ? "시스템" : "관리자";
}

import { z } from "zod";

import { normalizeLoginEmail } from "@/lib/auth/normalize-login-email";
import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  MembersResult,
  UpdateMemberInput,
  UpdatedMember,
} from "@/services/members/types";

const updateMemberSchema = z.object({
  loginId: z.string().trim().min(1, "아이디를 입력해 주세요."),
  password: z
    .union([
      z.literal(""),
      z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
    ])
    .optional(),
  role: z.enum(["admin", "master"]),
  name: z.string().optional(),
});

function normalizeName(name: string | undefined): string | null {
  const trimmed = name?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateMember(
  targetId: string,
  input: UpdateMemberInput
): Promise<MembersResult<UpdatedMember>> {
  const parsed = updateMemberSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { ok: false, error: firstIssue };
  }

  const existing = await prisma.profile.findUnique({
    where: { id: targetId },
  });

  if (!existing) {
    return { ok: false, error: "프로필을 찾을 수 없습니다." };
  }

  const email = normalizeLoginEmail(parsed.data.loginId);

  if (!z.email().safeParse(email).success) {
    return { ok: false, error: "유효한 아이디를 입력해 주세요." };
  }

  const nextName = normalizeName(parsed.data.name);
  const nextRole = parsed.data.role;
  const nextPassword = parsed.data.password?.trim() ?? "";

  const emailChanged = existing.email !== email;
  const roleChanged = existing.role !== nextRole;
  const nameChanged = existing.name !== nextName;
  const passwordChanged = nextPassword.length > 0;

  if (!emailChanged && !roleChanged && !nameChanged && !passwordChanged) {
    return { ok: false, error: "변경된 내용이 없습니다." };
  }

  if (emailChanged) {
    const duplicate = await prisma.profile.findUnique({
      where: { email },
    });

    if (duplicate && duplicate.id !== targetId) {
      return { ok: false, error: "이미 등록된 아이디입니다." };
    }
  }

  if (roleChanged && existing.role === "master" && nextRole === "admin") {
    const masterCount = await prisma.profile.count({
      where: { role: "master" },
    });

    if (masterCount <= 1) {
      return {
        ok: false,
        error: "마지막 시스템 계정의 역할은 변경할 수 없습니다.",
      };
    }
  }

  const supabase = createAdminClient();
  const authUpdate: { email?: string; email_confirm?: boolean; password?: string } =
    {};

  if (emailChanged) {
    authUpdate.email = email;
    authUpdate.email_confirm = true;
  }

  if (passwordChanged) {
    authUpdate.password = nextPassword;
  }

  if (Object.keys(authUpdate).length > 0) {
    const { error } = await supabase.auth.admin.updateUserById(
      targetId,
      authUpdate
    );

    if (error) {
      const message = error.message.toLowerCase();

      if (message.includes("already") || error.status === 422) {
        return { ok: false, error: "이미 등록된 아이디입니다." };
      }

      return { ok: false, error: "계정 정보 변경에 실패했습니다." };
    }
  }

  try {
    const updated = await prisma.profile.update({
      where: { id: targetId },
      data: {
        ...(emailChanged ? { email } : {}),
        ...(roleChanged ? { role: nextRole } : {}),
        ...(nameChanged ? { name: nextName } : {}),
      },
    });

    return {
      ok: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
      },
    };
  } catch {
    if (emailChanged) {
      await supabase.auth.admin.updateUserById(targetId, {
        email: existing.email,
        email_confirm: true,
      });
    }

    return { ok: false, error: "프로필 변경에 실패했습니다." };
  }
}

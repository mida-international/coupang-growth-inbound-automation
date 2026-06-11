"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireMaster } from "@/lib/auth/profile";
import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

const createAdminSchema = z.object({
  email: z.email("유효한 이메일을 입력해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  name: z.string().optional(),
  role: z.enum(["admin", "master"]),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

export type CreateAdminResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createAdmin(
  input: CreateAdminInput
): Promise<CreateAdminResult> {
  await requireMaster();

  const parsed = createAdminSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { ok: false, error: firstIssue };
  }

  const { email, password, name, role } = parsed.data;

  const existingProfile = await prisma.profile.findUnique({
    where: { email },
  });

  if (existingProfile) {
    return { ok: false, error: "이미 등록된 이메일입니다." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("already") || error.status === 422) {
      return { ok: false, error: "이미 등록된 이메일입니다." };
    }

    return { ok: false, error: "관리자 계정 생성에 실패했습니다." };
  }

  if (!data.user) {
    return { ok: false, error: "관리자 계정 생성에 실패했습니다." };
  }

  try {
    await prisma.profile.create({
      data: {
        id: data.user.id,
        email,
        name: name ?? null,
        role,
      },
    });
  } catch {
    await supabase.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: "프로필 생성에 실패했습니다." };
  }

  revalidatePath("/settings/members");
  return { ok: true };
}

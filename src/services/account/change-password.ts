import { z } from "zod";

import type { AccountResult, ChangePasswordInput } from "@/services/account/types";
import { createClient } from "@/lib/supabase/server";

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "현재 비밀번호를 입력해 주세요."),
    newPassword: z
      .string()
      .min(8, "비밀번호는 8자 이상이어야 합니다."),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
    path: ["newPassword"],
  });

export async function changePassword(
  input: ChangePasswordInput
): Promise<AccountResult> {
  const parsed = changePasswordSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { ok: false, error: firstIssue };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  if (!user.email) {
    return { ok: false, error: "계정 이메일을 확인할 수 없습니다." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return { ok: false, error: "현재 비밀번호가 올바르지 않습니다." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return {
      ok: false,
      error: updateError.message || "비밀번호 변경에 실패했습니다.",
    };
  }

  return { ok: true, data: undefined };
}

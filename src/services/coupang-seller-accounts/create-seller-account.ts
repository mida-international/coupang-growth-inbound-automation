import { z } from "zod";

import { prisma } from "@/lib/db";
import type {
  CreateSellerAccountInput,
  SellerAccountView,
  SellerAccountsResult,
} from "@/services/coupang-seller-accounts/types";

const createSellerAccountSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "쿠팡 판매자 계정을 입력해 주세요.")
    .max(100, "쿠팡 판매자 계정은 100자 이하여야 합니다."),
  isActive: z.boolean().optional(),
  createdById: z.string().min(1),
});

export async function createSellerAccount(
  input: CreateSellerAccountInput
): Promise<SellerAccountsResult<SellerAccountView>> {
  const parsed = createSellerAccountSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { ok: false, error: firstIssue };
  }

  const { displayName, isActive = true, createdById } = parsed.data;

  const creator = await prisma.profile.findUnique({
    where: { id: createdById },
    select: { id: true },
  });

  if (!creator) {
    return { ok: false, error: "생성자 정보를 찾을 수 없습니다." };
  }

  try {
    const account = await prisma.coupangSellerAccount.create({
      data: {
        displayName,
        isActive,
        createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return { ok: true, data: account };
  } catch {
    return { ok: false, error: "판매자 계정 등록에 실패했습니다." };
  }
}

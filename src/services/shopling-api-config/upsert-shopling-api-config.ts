import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  isMaskedApiKeyPlaceholder,
  maskApiKey,
} from "@/services/shopling-api-config/mask-api-key";
import type {
  ShoplingApiConfigResult,
  ShoplingApiConfigView,
  UpsertShoplingApiConfigInput,
} from "@/services/shopling-api-config/types";

const SHOPLING_API_CONFIG_ID = "default";

const upsertShoplingApiConfigSchema = z.object({
  loginId: z
    .string()
    .trim()
    .min(1, "로그인 ID를 입력해 주세요.")
    .max(100, "로그인 ID는 100자 이하여야 합니다."),
  companyId: z
    .string()
    .trim()
    .min(1, "회사 ID를 입력해 주세요.")
    .max(100, "회사 ID는 100자 이하여야 합니다."),
  apiAuthKey: z.string().optional(),
  updatedById: z.string().min(1),
});

type UpsertShoplingApiConfigParams = UpsertShoplingApiConfigInput & {
  updatedById: string;
};

export async function upsertShoplingApiConfig(
  input: UpsertShoplingApiConfigParams,
): Promise<ShoplingApiConfigResult<ShoplingApiConfigView>> {
  const parsed = upsertShoplingApiConfigSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { ok: false, error: firstIssue };
  }

  const { loginId, companyId, apiAuthKey, updatedById } = parsed.data;

  const existing = await prisma.shoplingApiConfig.findUnique({
    where: { id: SHOPLING_API_CONFIG_ID },
    select: { apiAuthKey: true },
  });

  let resolvedApiAuthKey = apiAuthKey?.trim() ?? "";

  if (
    existing &&
    isMaskedApiKeyPlaceholder(resolvedApiAuthKey, existing.apiAuthKey)
  ) {
    resolvedApiAuthKey = existing.apiAuthKey;
  }

  if (!resolvedApiAuthKey) {
    return { ok: false, error: "API 인증 키를 입력해 주세요." };
  }

  try {
    const config = await prisma.shoplingApiConfig.upsert({
      where: { id: SHOPLING_API_CONFIG_ID },
      create: {
        id: SHOPLING_API_CONFIG_ID,
        loginId,
        companyId,
        apiAuthKey: resolvedApiAuthKey,
        updatedById,
      },
      update: {
        loginId,
        companyId,
        apiAuthKey: resolvedApiAuthKey,
        updatedById,
      },
    });

    return {
      ok: true,
      data: {
        loginId: config.loginId,
        companyId: config.companyId,
        apiAuthKeyMasked: maskApiKey(config.apiAuthKey),
        hasConfig: true,
        updatedAt: config.updatedAt.toISOString(),
      },
    };
  } catch {
    return { ok: false, error: "샵플링 API 설정 저장에 실패했습니다." };
  }
}

import "server-only";

import { prisma } from "@/lib/db";
import type {
  ShoplingApiConfigResult,
  ShoplingApiConfigSecret,
} from "@/services/shopling-api-config/types";

const SHOPLING_API_CONFIG_ID = "default";

export async function getShoplingApiConfigSecret(): Promise<
  ShoplingApiConfigResult<ShoplingApiConfigSecret>
> {
  const config = await prisma.shoplingApiConfig.findUnique({
    where: { id: SHOPLING_API_CONFIG_ID },
  });

  if (!config) {
    return {
      ok: false,
      error: "샵플링 API 설정이 저장되어 있지 않습니다.",
    };
  }

  return {
    ok: true,
    data: {
      loginId: config.loginId,
      companyId: config.companyId,
      apiAuthKey: config.apiAuthKey,
    },
  };
}

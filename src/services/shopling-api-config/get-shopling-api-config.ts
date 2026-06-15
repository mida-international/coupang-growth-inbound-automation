import { prisma } from "@/lib/db";
import { maskApiKey } from "@/services/shopling-api-config/mask-api-key";
import type {
  ShoplingApiConfigResult,
  ShoplingApiConfigView,
} from "@/services/shopling-api-config/types";

const SHOPLING_API_CONFIG_ID = "default";

export async function getShoplingApiConfig(): Promise<
  ShoplingApiConfigResult<ShoplingApiConfigView>
> {
  const config = await prisma.shoplingApiConfig.findUnique({
    where: { id: SHOPLING_API_CONFIG_ID },
  });

  if (!config) {
    return {
      ok: true,
      data: {
        loginId: "",
        companyId: "",
        apiAuthKeyMasked: "",
        hasConfig: false,
        updatedAt: null,
      },
    };
  }

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
}

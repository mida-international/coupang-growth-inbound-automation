import "server-only";

import type { ApiResult } from "@/lib/api/types";
import { loginShoplingWms as loginShoplingWmsLib } from "@/lib/shopling-wms/login-shopling-wms";
import {
  isShoplingWmsLoginAvailable,
  SHOPLING_WMS_LOGIN_UNAVAILABLE_MESSAGE,
} from "@/lib/shopling-wms/runtime";

export type ShoplingWmsLoginData = {
  loggedIn: true;
};

export type ShoplingWmsLoginServiceResult = ApiResult<ShoplingWmsLoginData>;

export async function loginShoplingWms(
  userId: string,
): Promise<ShoplingWmsLoginServiceResult> {
  if (!isShoplingWmsLoginAvailable()) {
    return { ok: false, error: SHOPLING_WMS_LOGIN_UNAVAILABLE_MESSAGE };
  }

  try {
    const result = await loginShoplingWmsLib(userId);

    if (!result.ok) {
      return { ok: false, error: result.message };
    }

    return { ok: true, data: { loggedIn: true } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "로그인에 실패했습니다.";

    return { ok: false, error: message };
  }
}

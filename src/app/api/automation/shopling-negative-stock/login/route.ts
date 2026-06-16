import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { loginShoplingWms } from "@/services/shopling-wms-automation/login-shopling-wms";

export const maxDuration = 300;

export async function POST() {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const result = await loginShoplingWms(auth.profile.id);

    return fromServiceResult(result, { errorStatus: 422 });
  } catch (error) {
    logRouteError(error, {
      route: "/api/automation/shopling-negative-stock/login",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

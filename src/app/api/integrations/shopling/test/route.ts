import { requireApiMaster } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { testShoplingApiConnection } from "@/services/shopling-api-config/test-shopling-api-connection";

export async function POST() {
  try {
    const auth = await requireApiMaster();

    if ("response" in auth) {
      return auth.response;
    }

    const result = await testShoplingApiConnection();

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/integrations/shopling/test",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

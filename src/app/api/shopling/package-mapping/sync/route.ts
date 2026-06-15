import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { syncShoplingPackageMapping } from "@/services/shopling-package-mapping/sync-shopling-package-mapping";

export const maxDuration = 300;

export async function POST() {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const result = await syncShoplingPackageMapping();

    return fromServiceResult(result, { errorStatus: 500 });
  } catch (error) {
    logRouteError(error, {
      route: "/api/shopling/package-mapping/sync",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

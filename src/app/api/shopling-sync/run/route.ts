import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { syncShoplingInventory } from "@/services/shopling-sync/sync-shopling-inventory";

export const maxDuration = 300;

export async function POST() {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const result = await syncShoplingInventory({
      uploadedById: auth.profile.id,
    });

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/shopling-sync/run",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

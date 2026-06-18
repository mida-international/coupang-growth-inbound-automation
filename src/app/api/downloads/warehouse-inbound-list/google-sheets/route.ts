import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { parseWarehouseInboundRotation } from "@/services/deliverables/generate-warehouse-inbound-list-context";
import { pushWarehouseInboundListToGoogleSheets } from "@/services/deliverables/push-warehouse-inbound-list-to-google-sheets";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const searchParams = new URL(request.url).searchParams;
    const sellerId = searchParams.get("seller")?.trim();
    const rotation = parseWarehouseInboundRotation(searchParams.get("rotation"));

    if (!sellerId) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    const result = await pushWarehouseInboundListToGoogleSheets({
      coupangSellerAccountId: sellerId,
      rotation,
    });

    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return jsonSuccess(result.data);
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/warehouse-inbound-list/google-sheets",
      method: "POST",
    });

    const message =
      error instanceof Error ? error.message : "Google Sheets 복사에 실패했습니다.";

    return jsonError(message, 500);
  }
}

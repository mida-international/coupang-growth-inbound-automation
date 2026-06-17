import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { parseWarehouseInboundRotation } from "@/services/deliverables/generate-warehouse-inbound-list-context";
import { listWarehouseInboundDeliverables } from "@/services/deliverables/list-warehouse-inbound-deliverables";
import { recordWarehouseInboundDeliverable } from "@/services/deliverables/record-warehouse-inbound-deliverable";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Number(url.searchParams.get("pageSize")) || undefined;

    const result = await listWarehouseInboundDeliverables({ page, pageSize });

    return jsonSuccess(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/warehouse-inbound-deliverables",
      method: "GET",
    });

    return jsonError("입고리스트 기록 목록 조회에 실패했습니다.", 500);
  }
}

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

    const result = await recordWarehouseInboundDeliverable({
      coupangSellerAccountId: sellerId,
      rotation,
      recordedById: auth.profile.id,
    });

    return jsonSuccess(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/warehouse-inbound-deliverables",
      method: "POST",
    });

    const message =
      error instanceof Error ? error.message : "입고리스트 기록에 실패했습니다.";

    return jsonError(message, message.includes("판매자") ? 400 : 500);
  }
}

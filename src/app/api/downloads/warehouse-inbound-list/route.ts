import { requireApiProfile } from "@/lib/api/auth";
import { encodeContentDispositionFilename } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  generateWarehouseInboundListContext,
  parseWarehouseInboundRotation,
} from "@/services/deliverables/generate-warehouse-inbound-list-context";

export async function GET(request: Request) {
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

    const context = await generateWarehouseInboundListContext(sellerId, rotation);

    return new Response(new Uint8Array(context.buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encodeContentDispositionFilename(
          context.outputFileName,
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/warehouse-inbound-list",
      method: "GET",
    });

    const message =
      error instanceof Error ? error.message : "입고리스트 생성에 실패했습니다.";

    return jsonError(message, message.includes("판매자") ? 400 : 500);
  }
}

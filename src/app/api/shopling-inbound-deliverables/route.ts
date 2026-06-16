import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { resolveShoplingInboundErrorStatus } from "@/lib/deliverables/resolve-shopling-inbound-error-status";
import { recordShoplingInboundDeliverable } from "@/services/deliverables/record-shopling-inbound-deliverable";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const inboundListFile = formData.get("inboundListFile");

    if (!(inboundListFile instanceof File)) {
      return jsonError("입고 리스트 엑셀 파일을 선택해 주세요.", 400);
    }

    const inboundListBuffer = Buffer.from(await inboundListFile.arrayBuffer());

    const result = await recordShoplingInboundDeliverable({
      inboundListBuffer,
      sourceFileName: inboundListFile.name,
      recordedById: auth.profile.id,
    });

    return jsonSuccess(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/shopling-inbound-deliverables",
      method: "POST",
    });

    const message =
      error instanceof Error
        ? error.message
        : "입고 기록에 실패했습니다.";

    return jsonError(message, resolveShoplingInboundErrorStatus(message));
  }
}

import { requireApiProfile } from "@/lib/api/auth";
import { resolveActiveSellerAccount } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getLatestInboundTemplateFile } from "@/services/coupang-growth-sync/get-latest-inbound-template-file";
import { recordCoupangInbound } from "@/services/deliverables/record-coupang-inbound";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const sellerId = formData.get("seller");
    const boxListFile = formData.get("boxListFile");

    if (typeof sellerId !== "string" || sellerId.trim().length === 0) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    if (!(boxListFile instanceof File)) {
      return jsonError("박스 입고 리스트 엑셀 파일을 선택해 주세요.", 400);
    }

    const seller = await resolveActiveSellerAccount(sellerId.trim());

    if (!seller) {
      return jsonError("유효한 판매자 계정이 아닙니다.", 400);
    }

    const templateFile = await getLatestInboundTemplateFile(sellerId.trim());

    if (!templateFile) {
      return jsonError(
        "저장된 WING 입고 템플릿이 없습니다. 데이터 동기화 > 쿠팡 Growth에서 입고 템플릿을 먼저 업로드해주세요.",
        400,
      );
    }

    const boxListBuffer = Buffer.from(await boxListFile.arrayBuffer());

    const result = await recordCoupangInbound({
      coupangSellerAccountId: seller.id,
      recordedById: auth.profile.id,
      templateBuffer: templateFile.buffer,
      boxListInput: {
        source: "excel",
        boxListBuffer,
      },
    });

    return jsonSuccess(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/inbound-records",
      method: "POST",
    });

    const message =
      error instanceof Error ? error.message : "입고 기록에 실패했습니다.";

    return jsonError(message, 500);
  }
}

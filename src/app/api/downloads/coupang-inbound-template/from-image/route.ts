import { requireApiProfile } from "@/lib/api/auth";
import {
  encodeContentDispositionFilename,
  resolveActiveSellerAccount,
} from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  assertVisionExtractedData,
  parseVisionDataJson,
} from "@/lib/vision/parse-vision-form-data";
import { getLatestInboundTemplateFile } from "@/services/coupang-growth-sync/get-latest-inbound-template-file";
import {
  buildVisionInboundTemplateFilename,
  generateCoupangInboundFromVision,
} from "@/services/vision-box-list/generate-coupang-inbound-from-vision";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const sellerId = formData.get("seller");
    const visionDataRaw = parseVisionDataJson(formData.get("visionData"));
    const visionData = assertVisionExtractedData(visionDataRaw);

    if (typeof sellerId !== "string" || sellerId.trim().length === 0) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    const seller = await resolveActiveSellerAccount(sellerId.trim());

    if (!seller) {
      return jsonError("유효한 판매자 계정이 아닙니다.", 400);
    }

    const templateFile = await getLatestInboundTemplateFile(sellerId.trim());

    if (!templateFile) {
      return jsonError(
        "저장된 WING 입고 템플릿이 없습니다. 데이터 동기화 > 쿠팡 Growth에서 입고 템플릿을 먼저 업로드해 주세요.",
        400,
      );
    }

    const result = await generateCoupangInboundFromVision({
      templateBuffer: templateFile.buffer,
      visionData,
    });

    const filename = buildVisionInboundTemplateFilename();

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encodeContentDispositionFilename(filename),
        "X-Filter-Matched": String(result.stats.matched),
        "X-Filter-Unmatched": String(result.stats.unmatched.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/coupang-inbound-template/from-image",
      method: "POST",
    });

    const message =
      error instanceof Error
        ? error.message
        : "이미지 기반 입고 템플릿 생성에 실패했습니다.";

    return jsonError(message, 500);
  }
}

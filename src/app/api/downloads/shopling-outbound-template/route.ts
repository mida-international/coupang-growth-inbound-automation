import { requireApiProfile } from "@/lib/api/auth";
import {
  encodeContentDispositionFilename,
  resolveActiveSellerAccount,
} from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import { buildShoplingOutboundFilename } from "@/lib/excel/generators/build-shopling-outbound-filename";
import { generateShoplingOutboundTemplate } from "@/services/deliverables/generate-shopling-outbound-template";

function resolveOutboundErrorStatus(message: string): number {
  if (message.includes("출고 템플릿에 넣을 바코드가 없습니다")) {
    return 422;
  }

  if (
    message.includes("[출고 리스트 오류]") ||
    message.includes("출고 리스트에서 유효한")
  ) {
    return 400;
  }

  return 500;
}

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
      return jsonError("출고 리스트 엑셀 파일을 선택해 주세요.", 400);
    }

    const seller = await resolveActiveSellerAccount(sellerId.trim());

    if (!seller) {
      return jsonError("유효한 판매자 계정이 아닙니다.", 400);
    }

    const boxListBuffer = Buffer.from(await boxListFile.arrayBuffer());

    const result = await generateShoplingOutboundTemplate({
      boxListBuffer,
    });

    const filename = buildShoplingOutboundFilename();

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encodeContentDispositionFilename(filename),
        "X-Outbound-Rows": String(result.stats.outputRows),
        "X-Outbound-Packages-Decomposed": String(
          result.stats.packagesDecomposed,
        ),
        "X-Outbound-Skipped-Packages": String(
          result.stats.skippedUnmappedPackages.length,
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/shopling-outbound-template",
      method: "POST",
    });

    const message =
      error instanceof Error
        ? error.message
        : "샵플링 출고 템플릿 생성에 실패했습니다.";

    return jsonError(message, resolveOutboundErrorStatus(message));
  }
}

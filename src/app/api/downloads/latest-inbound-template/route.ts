import { requireApiProfile } from "@/lib/api/auth";
import { resolveActiveSellerAccount } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  getLatestInboundTemplateFile,
  getLatestInboundTemplateFileMeta,
} from "@/services/coupang-growth-sync/get-latest-inbound-template-file";

export async function HEAD(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const sellerId = new URL(request.url).searchParams.get("seller")?.trim();

    if (!sellerId) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    const seller = await resolveActiveSellerAccount(sellerId);

    if (!seller) {
      return jsonError("유효한 판매자 계정이 아닙니다.", 400);
    }

    const meta = await getLatestInboundTemplateFileMeta(sellerId);

    if (!meta.exists) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: {
        "X-Template-Updated-At": meta.updatedAt ?? "",
        "X-Template-Available": "true",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/latest-inbound-template",
      method: "HEAD",
    });
    return new Response(null, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const sellerId = new URL(request.url).searchParams.get("seller")?.trim();

    if (!sellerId) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    const seller = await resolveActiveSellerAccount(sellerId);

    if (!seller) {
      return jsonError("유효한 판매자 계정이 아닙니다.", 400);
    }

    const templateFile = await getLatestInboundTemplateFile(sellerId);

    if (!templateFile) {
      return jsonError(
        "저장된 입고 템플릿이 없습니다. 데이터 동기화 > 쿠팡 Growth에서 입고 템플릿을 먼저 업로드해주세요.",
        404,
      );
    }

    return new Response(new Uint8Array(templateFile.buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "X-Template-Updated-At": templateFile.updatedAt ?? "",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/latest-inbound-template",
      method: "GET",
    });
    return jsonError("템플릿 조회에 실패했습니다.", 500);
  }
}

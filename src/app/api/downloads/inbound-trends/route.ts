import { requireApiProfile } from "@/lib/api/auth";
import {
  encodeContentDispositionFilename,
  resolveActiveSellerAccount,
} from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildInboundTrendsFilename,
  generateInboundTrendsBuffer,
} from "@/lib/excel/generators/inbound-trends-export";
import { listInboundTrends } from "@/services/inbound-trends/list-inbound-trends";

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const searchParams = new URL(request.url).searchParams;
    const sellerId = searchParams.get("seller")?.trim();

    if (!sellerId) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    const seller = await resolveActiveSellerAccount(sellerId);

    if (!seller) {
      return jsonError("유효하지 않은 판매자 계정입니다.", 400);
    }

    const data = await listInboundTrends({
      coupangSellerAccountId: sellerId,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      days: searchParams.get("days") ?? undefined,
      search: searchParams.get("q") ?? undefined,
      exportAll: true,
    });

    if (!data.snapshotDates || data.totalCount === 0) {
      return jsonError("다운로드할 추세 데이터가 없습니다.", 400);
    }

    const buffer = generateInboundTrendsBuffer(data.rows, data.dates);
    const outputFileName = buildInboundTrendsFilename(
      seller.displayName,
      data.dateRange.from,
      data.dateRange.to,
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encodeContentDispositionFilename(outputFileName),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/inbound-trends",
      method: "GET",
    });

    const message =
      error instanceof Error ? error.message : "추세조회 다운로드에 실패했습니다.";

    return jsonError(message, 500);
  }
}

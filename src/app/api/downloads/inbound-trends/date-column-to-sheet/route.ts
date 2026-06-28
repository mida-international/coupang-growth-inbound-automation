import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { pushTrendsDateColumnToSheet } from "@/services/inbound-trends/push-trends-date-column-to-sheet";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const body = (await request.json().catch(() => null)) as {
      seller?: string;
      date?: string;
      kind?: string;
      title?: string;
    } | null;

    const sellerId = body?.seller?.trim();
    const date = body?.date?.trim();
    const kind =
      body?.kind === "warehouse"
        ? "warehouse"
        : body?.kind === "coupang"
          ? "coupang"
          : null;
    const title = body?.title?.trim();

    if (!sellerId) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return jsonError("날짜 형식이 올바르지 않습니다.", 400);
    }

    if (!kind) {
      return jsonError("열 종류(coupang/warehouse)가 올바르지 않습니다.", 400);
    }

    if (!title) {
      return jsonError("열 제목이 필요합니다.", 400);
    }

    const result = await pushTrendsDateColumnToSheet({
      coupangSellerAccountId: sellerId,
      date,
      kind,
      title,
    });

    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return jsonSuccess(result.data);
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/inbound-trends/date-column-to-sheet",
      method: "POST",
    });

    const message =
      error instanceof Error ? error.message : "시트 기입에 실패했습니다.";

    return jsonError(message, 500);
  }
}

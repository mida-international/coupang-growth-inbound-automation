import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { deleteCoupangInboundDeliverable } from "@/services/deliverables/delete-coupang-inbound-deliverable";
import {
  isTrendsAutoPushAccount,
  syncCoupangTrendsColumn,
  toKstIsoDate,
} from "@/services/inbound-trends/sync-coupang-trends-column";

export const runtime = "nodejs";
// 원복 후 추세 시트 반영(Google Sheets API 여러 번 호출)까지 기다린다.
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const { id } = await context.params;
    const result = await deleteCoupangInboundDeliverable(id);

    if (!result.ok) {
      return jsonError(result.error, 400);
    }

    // mizucos 계정은 원복한 기록 날짜의 '(완)' 열을 남은 합계로 다시 반영한다 (없으면 열 삭제).
    const sheet = isTrendsAutoPushAccount(result.data.sellerDisplayName)
      ? await syncCoupangTrendsColumn({
          coupangSellerAccountId: result.data.coupangSellerAccountId,
          isoDate: toKstIsoDate(result.data.recordedAt),
          insertIfMissing: false,
        })
      : null;

    return jsonSuccess({ sheet });
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-inbound-deliverables/[id]",
      method: "DELETE",
    });
    return jsonError("입고리스트 기록 삭제에 실패했습니다.", 500);
  }
}

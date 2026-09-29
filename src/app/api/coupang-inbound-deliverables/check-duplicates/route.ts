import { requireApiProfile } from "@/lib/api/auth";
import { resolveActiveSellerAccount } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  computeSourceFingerprint,
  parseClientSourceFiles,
} from "@/lib/deliverables/coupang-inbound-source";
import { findDuplicateCoupangInboundDeliverables } from "@/services/deliverables/find-duplicate-coupang-inbound-deliverables";
import { isTrendsAutoPushAccount } from "@/services/inbound-trends/sync-coupang-trends-column";

export const runtime = "nodejs";

/**
 * 다운로드 팝업을 띄우기 전에 호출한다.
 * 오늘 같은 원본(파일/이미지)으로 기록된 게 있는지, 기록 시 추세 시트에도 반영되는 계정인지 알려준다.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const body = (await request.json().catch(() => null)) as {
      seller?: string;
      sourceFiles?: unknown;
    } | null;

    const sellerId = body?.seller?.trim();

    if (!sellerId) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    const seller = await resolveActiveSellerAccount(sellerId);

    if (!seller) {
      return jsonError("유효한 판매자 계정이 아닙니다.", 400);
    }

    const sourceFingerprint = computeSourceFingerprint(
      parseClientSourceFiles(body?.sourceFiles).map((file) => file.sha256),
    );

    const duplicates = sourceFingerprint
      ? await findDuplicateCoupangInboundDeliverables(seller.id, sourceFingerprint)
      : [];

    return jsonSuccess({
      duplicates,
      sheetSync: isTrendsAutoPushAccount(seller.displayName),
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-inbound-deliverables/check-duplicates",
      method: "POST",
    });

    return jsonError("중복 기록 확인에 실패했습니다.", 500);
  }
}

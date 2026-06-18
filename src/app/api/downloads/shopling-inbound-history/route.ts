import { requireApiProfile } from "@/lib/api/auth";
import { buildExcelDownloadResponse } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildShoplingInboundHistoryFilename,
  generateShoplingInboundHistoryBuffer,
} from "@/lib/excel/generators/shopling-inbound-history-export";
import { listShoplingInboundDeliverables } from "@/services/deliverables/list-shopling-inbound-deliverables";

export async function GET() {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const data = await listShoplingInboundDeliverables({ exportAll: true });

    if (data.rowCount === 0) {
      return jsonError("다운로드할 샵플링 입고 이력이 없습니다.", 400);
    }

    const buffer = generateShoplingInboundHistoryBuffer(data.rows);

    return buildExcelDownloadResponse(
      buffer,
      buildShoplingInboundHistoryFilename(),
    );
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/shopling-inbound-history",
      method: "GET",
    });

    const message =
      error instanceof Error
        ? error.message
        : "샵플링 입고 이력 엑셀 다운로드에 실패했습니다.";

    return jsonError(message, 500);
  }
}

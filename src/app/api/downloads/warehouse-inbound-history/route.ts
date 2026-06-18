import { requireApiProfile } from "@/lib/api/auth";
import { buildExcelDownloadResponse } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildWarehouseInboundHistoryFilename,
  generateWarehouseInboundHistoryBuffer,
} from "@/lib/excel/generators/warehouse-inbound-history-export";
import { listWarehouseInboundDeliverables } from "@/services/deliverables/list-warehouse-inbound-deliverables";

export async function GET() {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const data = await listWarehouseInboundDeliverables({ exportAll: true });

    if (data.rowCount === 0) {
      return jsonError("다운로드할 창고전송 입고 이력이 없습니다.", 400);
    }

    const buffer = generateWarehouseInboundHistoryBuffer(data.rows);

    return buildExcelDownloadResponse(
      buffer,
      buildWarehouseInboundHistoryFilename(),
    );
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/warehouse-inbound-history",
      method: "GET",
    });

    const message =
      error instanceof Error
        ? error.message
        : "창고전송 입고 이력 엑셀 다운로드에 실패했습니다.";

    return jsonError(message, 500);
  }
}

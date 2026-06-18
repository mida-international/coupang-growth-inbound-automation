import { requireApiProfile } from "@/lib/api/auth";
import { buildExcelDownloadResponse } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildShoplingInventoryFilename,
  generateShoplingInventoryBuffer,
} from "@/lib/excel/generators/shopling-inventory-export";
import { listShoplingInventory } from "@/services/shopling-data/list-shopling-inventory";

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const searchParams = new URL(request.url).searchParams;
    const data = await listShoplingInventory({
      search: searchParams.get("q") ?? undefined,
      exportAll: true,
    });

    if (data.totalCount === 0) {
      return jsonError("다운로드할 샵플링 상품 데이터가 없습니다.", 400);
    }

    const buffer = generateShoplingInventoryBuffer(data.rows);

    return buildExcelDownloadResponse(
      buffer,
      buildShoplingInventoryFilename(data.snapshotDate),
    );
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/shopling-inventory",
      method: "GET",
    });

    const message =
      error instanceof Error
        ? error.message
        : "샵플링 상품 엑셀 다운로드에 실패했습니다.";

    return jsonError(message, 500);
  }
}

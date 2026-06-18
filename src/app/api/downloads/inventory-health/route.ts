import { requireApiProfile } from "@/lib/api/auth";
import { buildExcelDownloadResponse } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildInventoryHealthFilename,
  generateInventoryHealthBuffer,
} from "@/lib/excel/generators/inventory-health-export";
import { listInventoryHealth } from "@/services/coupang-growth-data/list-inventory-health";
import { resolveInventoryHealthSellerFilter } from "@/services/coupang-growth-data/resolve-inventory-health-seller-filter";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const searchParams = new URL(request.url).searchParams;
    const accounts = await listSellerAccounts();
    const sellerFilter = resolveInventoryHealthSellerFilter(
      accounts,
      searchParams.get("seller") ?? undefined,
    );

    const data = await listInventoryHealth({
      sellerFilter,
      search: searchParams.get("q") ?? undefined,
      exportAll: true,
    });

    if (!data.hasHealthData || data.totalCount === 0) {
      return jsonError("다운로드할 재고 현황 데이터가 없습니다.", 400);
    }

    const buffer = generateInventoryHealthBuffer(data.rows);

    return buildExcelDownloadResponse(buffer, buildInventoryHealthFilename());
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/inventory-health",
      method: "GET",
    });

    const message =
      error instanceof Error
        ? error.message
        : "재고 현황 엑셀 다운로드에 실패했습니다.";

    return jsonError(message, 500);
  }
}

import { requireApiProfile } from "@/lib/api/auth";
import { buildExcelDownloadResponse } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildNewOptionProductsFilename,
  generateNewOptionProductsBuffer,
} from "@/lib/excel/generators/new-option-products-export";
import { listNewOptionProducts } from "@/services/shopling-data/list-new-option-products";

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const searchParams = new URL(request.url).searchParams;
    const data = await listNewOptionProducts({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      days: searchParams.get("days") ?? undefined,
      search: searchParams.get("q") ?? undefined,
      exportAll: true,
    });

    if (!data.hasInventoryHistory || data.totalCount === 0) {
      return jsonError("다운로드할 신규 옵션 상품 데이터가 없습니다.", 400);
    }

    const buffer = generateNewOptionProductsBuffer(data.rows);

    return buildExcelDownloadResponse(
      buffer,
      buildNewOptionProductsFilename(data.from, data.to),
    );
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/new-option-products",
      method: "GET",
    });

    const message =
      error instanceof Error
        ? error.message
        : "신규 옵션 상품 엑셀 다운로드에 실패했습니다.";

    return jsonError(message, 500);
  }
}

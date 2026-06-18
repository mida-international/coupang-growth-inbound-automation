import { requireApiProfile } from "@/lib/api/auth";
import { buildExcelDownloadResponse } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildShoplingPackageMappingFilename,
  generateShoplingPackageMappingBuffer,
} from "@/lib/excel/generators/shopling-package-mapping-export";
import { listShoplingPackageMapping } from "@/services/shopling-package-mapping/list-shopling-package-mapping";

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const searchParams = new URL(request.url).searchParams;
    const data = await listShoplingPackageMapping({
      search: searchParams.get("q") ?? undefined,
      exportAll: true,
    });

    if (data.totalCount === 0) {
      return jsonError("다운로드할 패키지 매핑 데이터가 없습니다.", 400);
    }

    const buffer = generateShoplingPackageMappingBuffer(data.rows);

    return buildExcelDownloadResponse(
      buffer,
      buildShoplingPackageMappingFilename(),
    );
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/shopling-package-mapping",
      method: "GET",
    });

    const message =
      error instanceof Error
        ? error.message
        : "패키지 매핑 엑셀 다운로드에 실패했습니다.";

    return jsonError(message, 500);
  }
}

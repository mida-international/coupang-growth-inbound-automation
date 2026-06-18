import { requireApiProfile } from "@/lib/api/auth";
import { buildExcelDownloadResponse } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildCenterSeparationFilename,
  generateCenterSeparationBuffer,
} from "@/lib/excel/generators/center-separation-export";
import { listCenterSeparation } from "@/services/center-separation/list-center-separation";

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const searchParams = new URL(request.url).searchParams;
    const data = await listCenterSeparation({
      search: searchParams.get("q") ?? undefined,
      exportAll: true,
    });

    if (data.totalCount === 0) {
      return jsonError("다운로드할 센터분리 데이터가 없습니다.", 400);
    }

    const buffer = generateCenterSeparationBuffer(data.rows);

    return buildExcelDownloadResponse(buffer, buildCenterSeparationFilename());
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/center-separation",
      method: "GET",
    });

    const message =
      error instanceof Error
        ? error.message
        : "센터분리 엑셀 다운로드에 실패했습니다.";

    return jsonError(message, 500);
  }
}

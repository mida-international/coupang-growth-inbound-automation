import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { ingestCenterSeparationExcel } from "@/services/center-separation/ingest-center-separation-excel";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("엑셀 파일을 선택해 주세요.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestCenterSeparationExcel(buffer);

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-growth/center-separation/excel-upload",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

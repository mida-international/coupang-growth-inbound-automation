import { requireApiProfile } from "@/lib/api/auth";
import { encodeContentDispositionFilename } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  CENTER_SEPARATION_TEMPLATE_FILENAME,
  generateCenterSeparationTemplateBuffer,
} from "@/lib/excel/generators/center-separation-template";

export async function GET() {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const buffer = generateCenterSeparationTemplateBuffer();

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encodeContentDispositionFilename(
          CENTER_SEPARATION_TEMPLATE_FILENAME,
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/center-separation-template",
      method: "GET",
    });
    return jsonError("템플릿 다운로드에 실패했습니다.", 500);
  }
}

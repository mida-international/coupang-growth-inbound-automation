import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { extractBoxListFromImages } from "@/lib/vision/extract-box-list-from-images";
import { readVisionImageFiles } from "@/lib/vision/parse-vision-form-data";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const images = await readVisionImageFiles(formData);
    const result = await extractBoxListFromImages(images);

    return jsonSuccess(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/vision/extract-box-list",
      method: "POST",
    });

    const message =
      error instanceof Error ? error.message : "이미지 분석에 실패했습니다.";

    return jsonError(message, 500);
  }
}

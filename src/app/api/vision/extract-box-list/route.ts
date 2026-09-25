import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { buildMasterBarcodeIndex } from "@/lib/excel/build-template-barcode-index";
import { computeVisionStats } from "@/lib/vision/compute-vision-stats";
import { correctVisionBarcodesAgainstMaster } from "@/lib/vision/correct-barcodes-against-master";
import { extractBoxListFromImages } from "@/lib/vision/extract-box-list-from-images";
import { readVisionImageFiles } from "@/lib/vision/parse-vision-form-data";
import { getLatestInboundTemplateFile } from "@/services/coupang-growth-sync/get-latest-inbound-template-file";

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
    const seller = formData.get("seller");

    let result = await extractBoxListFromImages(images);

    // 판매자 마스터(WING 템플릿)로 바코드 교정: OCR이 살짝 틀리게 읽은 바코드를
    // 상품명+옵션으로 실제 바코드로 되돌린다. 여기서 교정하면 미리보기·입고템플릿·
    // 샵플링 파일이 모두 교정된 바코드를 쓰게 된다. 실패해도 추출 결과는 그대로 반환.
    if (typeof seller === "string" && seller.trim().length > 0) {
      try {
        const templateFile = await getLatestInboundTemplateFile(seller.trim());
        if (templateFile?.buffer) {
          const index = await buildMasterBarcodeIndex(templateFile.buffer);
          const { visionData, corrections } = correctVisionBarcodesAgainstMaster(
            result.visionData,
            index,
          );
          if (corrections.length > 0) {
            console.log(`[vision] 바코드 마스터 교정 ${corrections.length}건`);
          }
          result = {
            visionData,
            stats: computeVisionStats(visionData, {
              imageCount: result.stats.imageCount,
              boxNumbers: result.stats.boxNumbers,
            }),
          };
        }
      } catch (correctionError) {
        console.error(
          "[vision] 바코드 마스터 교정 실패 (교정 없이 진행):",
          correctionError,
        );
      }
    }

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

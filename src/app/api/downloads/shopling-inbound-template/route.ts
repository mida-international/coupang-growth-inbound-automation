import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { resolveShoplingInboundErrorStatus } from "@/lib/deliverables/resolve-shopling-inbound-error-status";
import { buildShoplingInboundFilename } from "@/lib/excel/generators/build-shopling-inbound-filename";
import { generateShoplingInboundTemplate } from "@/services/deliverables/generate-shopling-inbound-template";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const inboundListFile = formData.get("inboundListFile");

    if (!(inboundListFile instanceof File)) {
      return jsonError("입고 리스트 엑셀 파일을 선택해 주세요.", 400);
    }

    const inboundListBuffer = Buffer.from(await inboundListFile.arrayBuffer());

    const result = await generateShoplingInboundTemplate({
      inboundListBuffer,
    });

    // 파일과 행별 검증 결과를 함께 내려야 하므로 base64 JSON으로 반환한다.
    return jsonSuccess({
      fileName: buildShoplingInboundFilename(),
      fileBase64: result.buffer.toString("base64"),
      stats: {
        inputRows: result.stats.inputRows,
        outputRows: result.stats.outputRows,
        skippedRows: result.stats.skippedRows,
        skippedDummy: result.stats.skippedDummy,
        unmapped: result.stats.unmapped.length,
        ambiguous: result.stats.ambiguous.length,
      },
      validation: result.validation,
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/shopling-inbound-template",
      method: "POST",
    });

    const message =
      error instanceof Error
        ? error.message
        : "샵플링 입고 템플릿 생성에 실패했습니다.";

    return jsonError(message, resolveShoplingInboundErrorStatus(message));
  }
}

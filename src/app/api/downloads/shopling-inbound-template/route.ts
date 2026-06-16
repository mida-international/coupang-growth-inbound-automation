import { requireApiProfile } from "@/lib/api/auth";
import { encodeContentDispositionFilename } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
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

    const filename = buildShoplingInboundFilename();

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encodeContentDispositionFilename(filename),
        "X-Inbound-Rows": String(result.stats.outputRows),
        "X-Inbound-Input-Rows": String(result.stats.inputRows),
        "X-Inbound-Skipped-Rows": String(result.stats.skippedRows),
        "X-Inbound-Unmapped": String(result.stats.unmapped.length),
        "X-Inbound-Ambiguous": String(result.stats.ambiguous.length),
        "Cache-Control": "no-store",
      },
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

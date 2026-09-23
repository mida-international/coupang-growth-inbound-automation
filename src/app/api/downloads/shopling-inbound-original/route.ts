import { requireApiProfile } from "@/lib/api/auth";
import { encodeContentDispositionFilename } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import { generateShoplingInboundOriginalFile } from "@/services/deliverables/generate-shopling-inbound-original";

function resolveContentType(bookType: string): string {
  if (bookType === "xls" || bookType === "xlsb" || bookType === "xla") {
    return "application/vnd.ms-excel";
  }

  return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

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
    const result = await generateShoplingInboundOriginalFile({
      inboundListBuffer,
      originalFileName: inboundListFile.name,
    });

    const filename =
      inboundListFile.name.trim() || "shopling_inbound_original.xlsx";

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": resolveContentType(result.bookType),
        "Content-Disposition": encodeContentDispositionFilename(filename),
        "X-Inbound-Matched": String(result.stats.matched),
        "X-Inbound-Unmapped": String(result.stats.unmapped),
        "X-Inbound-Ambiguous": String(result.stats.ambiguous),
        "X-Inbound-Skipped-Dummy": String(result.stats.skippedDummy),
        "X-Inbound-Attempted": String(result.stats.totalAttempted),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/shopling-inbound-original",
      method: "POST",
    });

    const message =
      error instanceof Error
        ? error.message
        : "원본파일 생성에 실패했습니다.";

    return jsonError(message, 500);
  }
}

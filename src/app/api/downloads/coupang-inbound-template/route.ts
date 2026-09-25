import { requireApiProfile } from "@/lib/api/auth";
import {
  encodeContentDispositionFilename,
  resolveActiveSellerAccount,
} from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import { buildCoupangInboundTemplateFilename } from "@/lib/excel/generators/filter-inbound-template";
import { getLatestInboundTemplateFile } from "@/services/coupang-growth-sync/get-latest-inbound-template-file";
import { generateCoupangInboundTemplate } from "@/services/deliverables/generate-coupang-inbound-template";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const sellerId = formData.get("seller");
    const boxListFile = formData.get("boxListFile");

    if (typeof sellerId !== "string" || sellerId.trim().length === 0) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    if (!(boxListFile instanceof File)) {
      return jsonError("박스 입고 리스트 엑셀 파일을 선택해 주세요.", 400);
    }

    const seller = await resolveActiveSellerAccount(sellerId.trim());

    if (!seller) {
      return jsonError("유효한 판매자 계정이 아닙니다.", 400);
    }

    const templateFile = await getLatestInboundTemplateFile(sellerId.trim());

    if (!templateFile) {
      return jsonError(
        "저장된 WING 입고 템플릿이 없습니다. 데이터 동기화 > 쿠팡 Growth에서 입고 템플릿을 먼저 업로드해주세요.",
        400,
      );
    }

    const boxListBuffer = Buffer.from(await boxListFile.arrayBuffer());

    const result = await generateCoupangInboundTemplate({
      templateBuffer: templateFile.buffer,
      boxListInput: {
        source: "excel",
        boxListBuffer,
      },
    });

    const filename = buildCoupangInboundTemplateFilename(result.stats.source);

    // 매칭된 행들의 수량 총합(변경되지 않아야 할 수량이 바뀌었는지 한눈에 확인용).
    const quantitySum = result.matchedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    // 미매칭 바코드 목록(헤더 크기 보호 위해 최대 200개까지만 실어 보낸다).
    const unmatchedBarcodes = result.stats.unmatched.slice(0, 200).join(",");

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encodeContentDispositionFilename(filename),
        "X-Filter-Matched": String(result.stats.matched),
        "X-Filter-Unmatched": String(result.stats.unmatched.length),
        "X-Filter-Quantity-Sum": String(quantitySum),
        "X-Filter-Unmatched-Barcodes": unmatchedBarcodes,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/coupang-inbound-template",
      method: "POST",
    });

    const message =
      error instanceof Error
        ? error.message
        : "입고 템플릿 생성에 실패했습니다.";

    return jsonError(message, 500);
  }
}

import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { detectExcelTargetFromBuffer } from "@/lib/excel/detect-target";
import { ingestInboundTemplate } from "@/services/coupang-growth-sync/ingest-inbound-template";
import { ingestInventoryHealth } from "@/services/coupang-growth-sync/ingest-inventory-health";
import type { ExcelUploadFileResult } from "@/services/coupang-growth-sync/types";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const coupangSellerAccountId = formData.get("coupangSellerAccountId");

    if (
      typeof coupangSellerAccountId !== "string" ||
      coupangSellerAccountId.trim().length === 0
    ) {
      return jsonError("쿠팡 판매자 계정을 선택해 주세요.", 400);
    }

    const fileEntries = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (fileEntries.length === 0) {
      return jsonError("업로드할 엑셀 파일을 선택해 주세요.", 400);
    }

    const results: ExcelUploadFileResult[] = [];

    for (const file of fileEntries) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const detection = detectExcelTargetFromBuffer(buffer);

      if (!detection.ok) {
        results.push({
          fileName: file.name,
          ok: false,
          error: "엑셀 파일 유형을 식별할 수 없습니다.",
        });
        continue;
      }

      if (detection.targetId === "coupang_growth_inventory_health") {
        const ingestResult = await ingestInventoryHealth({
          buffer,
          sourceFile: file.name,
          coupangSellerAccountId: coupangSellerAccountId.trim(),
          uploadedById: auth.profile.id,
        });

        if (!ingestResult.ok) {
          results.push({
            fileName: file.name,
            ok: false,
            targetId: detection.targetId,
            error: ingestResult.error,
          });
          continue;
        }

        results.push({
          fileName: file.name,
          ok: true,
          targetId: detection.targetId,
          rowCount: ingestResult.data.rowCount,
        });
        continue;
      }

      if (detection.targetId === "coupang_growth_inbound_template") {
        const ingestResult = await ingestInboundTemplate({
          buffer,
          sourceFile: file.name,
          coupangSellerAccountId: coupangSellerAccountId.trim(),
          uploadedById: auth.profile.id,
        });

        if (!ingestResult.ok) {
          results.push({
            fileName: file.name,
            ok: false,
            targetId: detection.targetId,
            error: ingestResult.error,
          });
          continue;
        }

        results.push({
          fileName: file.name,
          ok: true,
          targetId: detection.targetId,
          rowCount: ingestResult.data.rowCount,
        });
        continue;
      }

      results.push({
        fileName: file.name,
        ok: false,
        error: "지원하지 않는 엑셀 파일 유형입니다.",
      });
    }

    const hasSuccess = results.some((result) => result.ok);

    if (!hasSuccess) {
      const firstError = results.find((result) => result.error)?.error;

      return jsonError(firstError ?? "엑셀 업로드에 실패했습니다.", 400);
    }

    return jsonSuccess({ results });
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-growth-sync/excel-upload",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

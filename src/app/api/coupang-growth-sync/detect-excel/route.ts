import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { detectExcelTargetFromBuffer } from "@/lib/excel/detect-target";
import type { ExcelIngestionTargetId } from "@/lib/excel/types";
import type { DetectExcelFileResult } from "@/services/coupang-growth-sync/types";

function parseAllowedTargetIds(
  value: FormDataEntryValue | null,
): readonly ExcelIngestionTargetId[] | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed.filter(
      (entry): entry is ExcelIngestionTargetId => typeof entry === "string",
    );
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const allowedTargetIds = parseAllowedTargetIds(
      formData.get("allowedTargetIds"),
    );

    const fileEntries = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (fileEntries.length === 0) {
      return jsonError("확인할 엑셀 파일을 선택해 주세요.", 400);
    }

    const results: DetectExcelFileResult[] = [];

    for (const file of fileEntries) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const detection = detectExcelTargetFromBuffer(buffer, allowedTargetIds);

      results.push({
        fileName: file.name,
        targetId: detection.ok ? detection.targetId : null,
      });
    }

    return jsonSuccess({ results });
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-growth-sync/detect-excel",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

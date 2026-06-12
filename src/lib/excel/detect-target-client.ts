import { apiPostFormData } from "@/lib/api-client";
import type { ExcelIngestionTargetId } from "@/lib/excel/types";
import type { DetectExcelResponse } from "@/services/coupang-growth-sync/types";

export async function detectExcelTargetIdFromFile(
  file: File,
  allowedTargetIds?: readonly ExcelIngestionTargetId[],
): Promise<ExcelIngestionTargetId | null> {
  const formData = new FormData();
  formData.append("files", file);

  if (allowedTargetIds && allowedTargetIds.length > 0) {
    formData.append("allowedTargetIds", JSON.stringify(allowedTargetIds));
  }

  const result = await apiPostFormData<DetectExcelResponse>(
    "/api/coupang-growth-sync/detect-excel",
    formData,
  );

  if (!result.ok) {
    return null;
  }

  const match = result.data.results.find(
    (entry) => entry.fileName === file.name,
  );

  return match?.targetId ?? null;
}

import type {
  ExcelUploadFileResult,
  ExcelUploadResultSummary,
} from "@/services/coupang-growth-sync/types";

export function summarizeExcelUpload(
  results: ExcelUploadFileResult[],
): ExcelUploadResultSummary {
  const successCount = results.filter((result) => result.ok).length;

  if (successCount === 0) {
    return { outcome: "error", results };
  }

  if (successCount === results.length) {
    return { outcome: "success", results };
  }

  return { outcome: "partial", results };
}

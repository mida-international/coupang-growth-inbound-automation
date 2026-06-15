import { rowMatchesTargetKeywords } from "@/lib/excel/match-header-keywords";
import { listTargets } from "@/lib/excel/targets/registry";
import type {
  ExcelIngestionTarget,
  ExcelIngestionTargetId,
  ExcelTargetDetectionResult,
} from "@/lib/excel/types";

const HEADER_SCAN_ROW_LIMIT = 30;

function matchTargetInRow(
  row: unknown[],
  target: ExcelIngestionTarget,
): boolean {
  return rowMatchesTargetKeywords(row, {
    requiredHeaderKeywords: target.requiredHeaderKeywords,
    requiredHeaderKeywordSets: target.requiredHeaderKeywordSets,
  });
}

export function detectExcelTargetFromRows(
  rows: unknown[][],
  allowedTargetIds?: readonly ExcelIngestionTargetId[],
): ExcelTargetDetectionResult {
  const candidates = listTargets(allowedTargetIds);

  if (candidates.length === 0) {
    return { ok: false, reason: "not_allowed" };
  }

  const scanLimit = Math.min(rows.length, HEADER_SCAN_ROW_LIMIT);

  for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
    const row = rows[rowIndex];

    if (!Array.isArray(row)) {
      continue;
    }

    for (const target of candidates) {
      if (matchTargetInRow(row, target)) {
        return { ok: true, targetId: target.id };
      }
    }
  }

  return { ok: false, reason: "unknown" };
}

export function detectExcelTargetFromBuffer(
  buffer: ArrayBuffer | Buffer,
  allowedTargetIds?: readonly ExcelIngestionTargetId[],
): ExcelTargetDetectionResult {
  const { readExcelRows } =
    require("@/lib/excel/read-workbook") as typeof import("@/lib/excel/read-workbook");
  const rows = readExcelRows(buffer, { maxRows: HEADER_SCAN_ROW_LIMIT });
  return detectExcelTargetFromRows(rows, allowedTargetIds);
}

import { listTargets } from "@/lib/excel/targets/registry";
import type {
  ExcelIngestionTarget,
  ExcelIngestionTargetId,
  ExcelTargetDetectionResult,
} from "@/lib/excel/types";

function matchesFilenamePattern(file: File, target: ExcelIngestionTarget) {
  if (!target.filenamePatterns?.length) {
    return false;
  }

  return target.filenamePatterns.some((pattern) => pattern.test(file.name));
}

function scoreTargetByFilename(file: File, target: ExcelIngestionTarget) {
  return matchesFilenamePattern(file, target) ? 1 : 0;
}

export function detectExcelTarget(
  file: File,
  allowedTargetIds?: readonly ExcelIngestionTargetId[],
): ExcelTargetDetectionResult {
  const candidates = listTargets(allowedTargetIds);

  if (candidates.length === 0) {
    return { ok: false, reason: "not_allowed" };
  }

  const scored = candidates
    .map((target) => ({
      target,
      score: scoreTargetByFilename(file, target),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scored[0];

  if (!best) {
    return { ok: false, reason: "unknown" };
  }

  return { ok: true, targetId: best.target.id };
}

export function detectExcelTargetId(
  file: File,
  allowedTargetIds?: readonly ExcelIngestionTargetId[],
): ExcelIngestionTargetId | null {
  const result = detectExcelTarget(file, allowedTargetIds);
  return result.ok ? result.targetId : null;
}

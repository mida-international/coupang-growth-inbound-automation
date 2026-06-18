import type { VisionExtractedData } from "@/lib/vision/types";

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  return trimmed;
}

function normalizeRow(row: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      continue;
    }

    normalized[key] = String(value).trim();
  }

  return normalized;
}

export type ParsedVisionPayload = VisionExtractedData & {
  metadata?: { boxNumbers?: string[] };
};

export function parseVisionJsonResponse(raw: string): ParsedVisionPayload {
  const jsonText = stripMarkdownFences(raw);

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Vision AI 응답 JSON 파싱에 실패했습니다.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Vision AI 응답 형식이 올바르지 않습니다.");
  }

  const payload = parsed as {
    columns?: unknown;
    rows?: unknown;
    metadata?: { boxNumbers?: unknown };
  };

  if (!Array.isArray(payload.columns) || !Array.isArray(payload.rows)) {
    throw new Error("Vision AI 응답에 columns/rows가 없습니다.");
  }

  const columns = payload.columns.map((column) => String(column).trim());

  const rows = payload.rows
    .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    .map(normalizeRow);

  const boxNumbers = Array.isArray(payload.metadata?.boxNumbers)
    ? payload.metadata.boxNumbers.map((value) => String(value).trim()).filter(Boolean)
    : [];

  return { columns, rows, metadata: { boxNumbers } };
}

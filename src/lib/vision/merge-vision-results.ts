import type { ParsedVisionPayload } from "@/lib/vision/parse-vision-json";
import type { VisionExtractedData } from "@/lib/vision/types";

const STANDARD_COLUMNS = [
  "date",
  "location",
  "등록상품명",
  "옵션",
  "바코드",
  "수량",
  "가용",
  "confidence",
] as const;

function uniqueColumns(payloads: ParsedVisionPayload[]): string[] {
  const seen = new Set<string>(STANDARD_COLUMNS);

  for (const payload of payloads) {
    for (const column of payload.columns) {
      seen.add(column);
    }
  }

  return Array.from(seen);
}

export function mergeVisionPayloads(payloads: ParsedVisionPayload[]): VisionExtractedData & {
  boxNumbers: string[];
} {
  const columns = uniqueColumns(payloads);
  const rows: Record<string, string>[] = [];
  const boxNumbers = new Set<string>();

  for (const payload of payloads) {
    for (const box of payload.metadata?.boxNumbers ?? []) {
      boxNumbers.add(box);
    }

    for (const row of payload.rows) {
      const normalized: Record<string, string> = {};

      for (const column of columns) {
        if (row[column] !== undefined) {
          normalized[column] = row[column];
        }
      }

      if (Object.keys(normalized).length > 0) {
        rows.push(normalized);
      }
    }
  }

  return {
    columns,
    rows,
    boxNumbers: Array.from(boxNumbers),
  };
}

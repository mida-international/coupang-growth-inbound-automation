export const EXTRACT_BOX_LIST_SYSTEM_PROMPT = `You transcribe a printed Korean warehouse packing list from a photo into structured JSON.

Return ONLY valid JSON (no markdown fences) with this shape:
{
  "columns": string[],
  "rows": Record<string, string>[],
  "metadata": { "boxNumbers": string[] }
}

COLUMNS — always use exactly these 7 keys, in this order:
date, location, 등록상품명, 옵션, 바코드, 수량, 가용
- If the table has a printed header row, map cells by that header.
- If there is no header, the printed cell order IS this column order (1=date, 2=location, 3=등록상품명, 4=옵션, 5=바코드, 6=수량, 7=가용).

WHAT TO TRANSCRIBE:
- Output ONLY the printed/typed text inside each cell, exactly as printed (keep Korean text verbatim).
- IGNORE pen marks: check marks (✓/∨), circles, loops, arrows, the # / △ symbols, margin notes, and anything outside the cell grid. Ignore blank cells (output "").
- THE ONLY pen mark that matters is an X or a strike-through/deletion line drawn THROUGH the printed 수량 — see the 수량 correction rule below.
- 바코드: digits only, no spaces.

수량 (column 6) CORRECTION RULE — the ONE case that changes a printed number. Apply exactly:
- Default: 수량 = the printed number in the 수량 cell, unchanged.
- Trigger — ONLY when the printed 수량 is struck out: it has an X over it, or a strike-through / deletion line crossing it out. A circle, check mark, or any other mark is NOT a trigger — for those, keep the printed number.
- When it is struck out, the corrected quantity is the handwritten number written to the RIGHT of the struck number (i.e. in the 가용 cell, column 7, or immediately to its right). Set 수량 = that right-side handwritten number.
- A handwritten number to the LEFT of the printed 수량 is NOT a correction — ignore it and keep the printed 수량.
- If the 수량 is struck out but there is no handwritten number to its right, keep the printed number.
- Always output the "가용" field as "" (it is only the source of the correction, never an output value).
- Examples:
  · printed 수량 "5" struck through, "1" handwritten to its right (가용) → 수량="1", 가용=""
  · printed 수량 "2" crossed out, "0" handwritten to its right → 수량="0", 가용=""
  · a handwritten number to the LEFT of the printed 수량 → ignore it, keep the printed 수량
  · printed 수량 circled or check-marked but not struck out → keep the printed number

OTHER:
- Include every printed data row that has a barcode. Rows whose corrected 수량 is 0 are still valid — include them.
- Skip completely blank rows and non-data rows (separators, repeated headers).
- Each row must include "confidence" as string "0.0" to "1.0" (your certainty for barcode + 수량).
- Box-number titles like "박스 - 15" / "박스-14" → metadata.boxNumbers. Do not put them in rows.
- Never invent rows or cells that are not visible in the image.`;

export function buildGeminiExtractUserPrompt(imageIndex: number, total: number): string {
  return `Image ${imageIndex + 1} of ${total}. Extract all table rows from this packing list photo.`;
}

export function buildClaudeVerifyUserPrompt(
  geminiJson: string,
  imageCount: number,
): string {
  return `Gemini extracted this JSON from ${imageCount} packing list photo(s):

${geminiJson}

Review against the image(s). Fix barcode misreads and apply the 수량 correction rule EXACTLY:
- Only a printed 수량 that is struck out (an X over it, or a strike-through / deletion line) is corrected. A circle, check mark, or any other mark is NOT a trigger — keep the printed number for those.
- When the printed 수량 is struck out, set 수량 to the handwritten number written to the RIGHT of it (in the 가용 cell, column 7, or immediately to its right). Do not overlook faint/small right-side digits.
- A handwritten number to the LEFT of the printed 수량 is NOT a correction — ignore it. If a struck number has no right-side handwritten number, keep the printed number.
- The 가용 field is ALWAYS "" in the output (only the source of the correction).
- Ignore all other handwriting: check marks (✓/∨), circles, arrows, #/△ symbols, and margin notes.
Use exactly the 7 columns (date, location, 등록상품명, 옵션, 바코드, 수량, 가용).
Return ONLY the corrected JSON in the same schema (columns, rows, metadata.boxNumbers).`;
}

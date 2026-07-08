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
- IGNORE most pen marks: check marks (✓/∨), arrows, the # / △ symbols, margin notes, and anything outside the cell grid. Ignore blank cells (output "").
- DO NOT ignore pen marks that signal a 수량 correction: a circle/loop/slash/X/strike drawn on the printed 수량, and any handwritten number in the 가용 cell or written over the 수량. These are meaningful — see the 수량 correction rule below.
- 바코드: digits only, no spaces.

수량 (column 6) CORRECTION RULE — apply carefully; this is the MOST-MISSED case, do not overlook it:
- Default: 수량 = the printed number in the 수량 cell.
- A handwritten (pen) number in the 가용 cell (column 7) is ALWAYS a deliberate correction of the quantity — never a stray mark. Whenever the 가용 cell holds a handwritten number, output 수량 = that handwritten number.
- This holds NO MATTER how the printed 수량 is marked — an X, strike-through, "-", a circle or loop drawn around it, a slash, a red pen mark, or even a subtle/small mark. The handwritten correction number always wins over the printed number.
- If a handwritten number is written directly over or right next to the printed 수량 (replacing it in place, not in the 가용 column), use that handwritten number as 수량.
- Always output the "가용" field as "" (it is the source of the correction, not an output value).
- Scan every row for a small or faint handwritten digit on the 수량 cell or in the 가용 column — if present, it IS the corrected 수량. When unsure between the printed number and a handwritten one, choose the handwritten one and lower the row's confidence.
- Examples:
  · printed 수량 "2" crossed out, "0" handwritten in 가용 → 수량="0", 가용=""
  · printed 수량 "5" circled/marked, "1" handwritten in 가용 → 수량="1", 가용=""
  · printed 수량 "5" with "1" handwritten over it → 수량="1", 가용=""

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

Review against the image(s). Fix barcode misreads and apply the 수량 correction rule precisely and thoroughly — it is the most-missed case:
- A handwritten number in the 가용 cell (or written directly over the 수량) is ALWAYS a deliberate quantity correction. Set 수량 to that handwritten number NO MATTER how the printed 수량 is marked — a circle/loop, slash, X, strike-through, "-", red pen, or even a subtle/small mark all count. The handwritten number always wins over the printed one.
- Scan every row for faint/small handwritten digits on the 수량 cell or in the 가용 column; do not overlook them. If none exists, keep the printed 수량.
- The 가용 field is ALWAYS "" in the output (it is only the source of the correction).
- Ignore only non-quantity handwriting: check marks (✓/∨), arrows, #/△ symbols, and margin notes.
Use exactly the 7 columns (date, location, 등록상품명, 옵션, 바코드, 수량, 가용).
Return ONLY the corrected JSON in the same schema (columns, rows, metadata.boxNumbers).`;
}

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
- IGNORE everything a human wrote by pen: check marks (✓/∨), circles, arrows, strike-throughs, the # / △ symbols, margin notes, and anything outside the cell grid. Ignore blank cells (output "").
- 바코드: digits only, no spaces.

THE ONE EXCEPTION — 수량 (column 6) correction:
- Normally 수량 = the printed number in the 수량 cell.
- BUT if the printed 수량 number has a human pen mark that invalidates it (an X over it, a strike-through, a "-", or similar "this number is wrong" mark) AND the 가용 cell (column 7) contains a human-handwritten number, then set 수량 = that handwritten 가용 number.
- The corrected number goes into 수량 ONLY. Always leave the "가용" field as "" (do not copy the handwritten number into 가용 — the 가용 column is the source of the correction, not an output value).
- Example: printed 수량 "2" is crossed out and "0" is handwritten in 가용 → output 수량="0", 가용="".

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

Review against the image(s). Fix barcode misreads and apply the 수량 correction rule precisely: when a printed 수량 is X-marked/struck and the 가용 cell has a handwritten number, set 수량 to that handwritten number and always leave 가용 ""; otherwise keep the printed 수량. The 가용 field is always "" in the output. Ignore all other handwriting (check marks, circles, margin notes).
Use exactly the 7 columns (date, location, 등록상품명, 옵션, 바코드, 수량, 가용).
Return ONLY the corrected JSON in the same schema (columns, rows, metadata.boxNumbers).`;
}

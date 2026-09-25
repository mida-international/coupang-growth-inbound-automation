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
- COLOR CUE: the strike/X and the right-side correction digit are usually drawn in red (or other colored) ink, distinct from the black printed table text. Use this color contrast to locate corrections you would otherwise miss — but a colored check mark, circle, or any mark that is NOT drawn through the 수량 is still NOT a correction.
- 바코드: digits only, no spaces.

수량 (column 6) CORRECTION RULE — the ONE case that changes a printed number. Apply exactly:
- Default: 수량 = the printed number in the 수량 cell, unchanged.
- Trigger — ONLY when the printed 수량 is struck out: it has an X over it, or a strike-through / deletion line crossing it out. A circle, check mark, or any other mark is NOT a trigger — for those, keep the printed number.
- When it is struck out, the corrected quantity is the handwritten number written to the RIGHT of the struck number (i.e. in the 가용 cell, column 7, or immediately to its right). Set 수량 = that right-side handwritten number.
- CHAINED CORRECTION — a correction that was itself corrected: if SEVERAL handwritten numbers appear to the right (e.g. one written, then crossed out, then a new one), use the FINAL value — the last, right-most handwritten number that is NOT itself struck out. Earlier/intermediate handwritten numbers are superseded; ignore them (an intermediate one is often struck through too).
- Read every number in FULL. Capture multi-digit corrections completely (10, 24, 100 …) — never drop or merge a digit. Example: a corrected value of "100" must be 수량="100", not "10" and not some other nearby number.
- A handwritten number to the LEFT of the printed 수량 is NOT a correction — ignore it and keep the printed 수량.
- If the 수량 is struck out but there is no handwritten number to its right, keep the printed number.
- Always output the "가용" field as "" (it is only the source of the correction, never an output value).
- MOST-MISSED CASE — check every row for it: a struck 수량 with a small red "0" written to its right means the item was cancelled / is out of stock, so the corrected 수량 is 0. Faint or tiny right-side digits — the "0" most of all — are the single most commonly overlooked correction. Deliberately scan the right edge of EVERY 수량 cell for one before concluding the printed number is unchanged.
- Examples:
  · printed 수량 "5" struck through, "1" handwritten to its right (가용) → 수량="1", 가용=""
  · printed 수량 "2" crossed out, "0" handwritten to its right → 수량="0", 가용=""
  · printed 수량 "100" struck out, "84" then "100" handwritten to its right (84 superseded by the final 100) → 수량="100", 가용=""
  · a handwritten number to the LEFT of the printed 수량 → ignore it, keep the printed 수량
  · printed 수량 circled or check-marked but not struck out → keep the printed number

OTHER:
- Include every printed data row that has a barcode. Rows whose corrected 수량 is 0 are still valid — include them.
- Skip completely blank rows and non-data rows (separators, repeated headers).
- Each row must include "confidence" as string "0.0" to "1.0". Confidence is driven ABOVE ALL by barcode legibility: NEVER guess or infer a barcode digit. If even one digit is blurry, ambiguous, or you are not fully certain of the ENTIRE barcode, transcribe only what you can actually see and set confidence LOW (0.4 or below) for that row. A barcode you had to guess, complete, or reconstruct is a low-confidence row, not a high-confidence one. It is far better to report an uncertain/partial barcode with low confidence than to output a confident-looking barcode that is wrong.
- Box-number titles like "박스 - 15" / "박스-14" → metadata.boxNumbers. Do not put them in rows.
- NEVER FABRICATE. Transcribe only what is actually printed/visible. Do not invent, guess, complete, duplicate, or "normalize" a 바코드 or a 수량. If a barcode is partly illegible, transcribe ONLY the digits you can clearly read and lower that row's confidence — do NOT fill in missing digits or nudge it toward a similar barcode (these codes often differ only in the last digit, so a guess silently becomes a different product). Do not add rows that are not printed, and do not split or merge printed rows — the number of output rows must equal the number of printed data rows you can actually see.`;

export function buildGeminiExtractUserPrompt(imageIndex: number, total: number): string {
  return `Image ${imageIndex + 1} of ${total}. Extract all table rows from this packing list photo.`;
}

export function buildClaudeVerifyUserPrompt(
  geminiJson: string,
  imageCount: number,
): string {
  return `Gemini extracted this JSON from ${imageCount} packing list photo(s):

${geminiJson}

Review Gemini's JSON against the image(s). The ONLY field you may change is 수량, and only per the correction rule below — apply it EXACTLY. Everything else must match what is actually visible; do NOT "improve", complete, or fill anything in.

NEVER FABRICATE (this is critical — wrong data here causes wrong stock to be inbound):
- Do NOT add, remove, split, or merge rows. Output exactly the printed data rows visible in the image — one per printed row. If Gemini invented a row that is not in the image, drop it; if it missed a printed row, add only a row you can actually see.
- Do NOT alter a 바코드 unless the image UNAMBIGUOUSLY shows Gemini misread a specific digit. Never invent, guess, complete, or "normalize" barcode digits toward a nearby code. These barcodes are long and often differ only in the last digit(s), so a wrong "fix" silently maps to a DIFFERENT product — when in any doubt, keep Gemini's barcode exactly as-is and lower that row's confidence.
- Keep 등록상품명, 옵션, location, date exactly as Gemini has them unless the printed text clearly differs.

수량 correction rule (the one change you are allowed to make):
- Only a printed 수량 that is struck out (an X over it, or a strike-through / deletion line) is corrected. A circle, check mark, or any other mark is NOT a trigger — keep the printed number for those.
- When the printed 수량 is struck out, set 수량 to the handwritten number written to the RIGHT of it (in the 가용 cell, column 7, or immediately to its right). Do not overlook faint/small right-side digits.
- Do NOT assume Gemini already caught the strikes — independently re-inspect EVERY row's 수량 cell in the image for a red X / strike-through and a red digit beside it. The most frequently missed correction is a struck 수량 with a small red "0" next to it (item cancelled / out of stock) → set 수량 = 0. The strike and correction digit are usually in red ink, distinct from the black printed text.
- CHAINED CORRECTION: if several handwritten numbers appear to the right of a struck 수량 (a correction that was itself corrected — e.g. "84" then "100"), take the FINAL / right-most one that is not itself struck out. The last value wins; ignore the superseded earlier ones (example: struck 100 with "84" then "100" → 수량="100", NOT 84).
- Read multi-digit corrections in FULL (10, 24, 100 …) — do not drop a digit or substitute a different nearby number.
- A handwritten number to the LEFT of the printed 수량 is NOT a correction — ignore it. If a struck number has no right-side handwritten number, keep the printed number.
- The 가용 field is ALWAYS "" in the output (only the source of the correction).
- Ignore all other handwriting: check marks (✓/∨), circles, arrows, #/△ symbols, and margin notes.
- CONFIDENCE MUST BE HONEST: if any barcode digit is unclear or you are not 100% certain of the full barcode, do NOT guess a digit — set that row's confidence to 0.4 or below. Never raise confidence just because Gemini looked confident. An uncertain barcode with low confidence is correct behaviour; a fabricated confident barcode is not.
Use exactly the 7 columns (date, location, 등록상품명, 옵션, 바코드, 수량, 가용).
Return ONLY the corrected JSON in the same schema (columns, rows, metadata.boxNumbers).`;
}

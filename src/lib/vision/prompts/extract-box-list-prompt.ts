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
- PLUS one extra key on every row: "printedQty" — see the 수량 correction rule. It is NOT a table column; it is an audit field.

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
- AUDIT FIELD "printedQty": when you applied a correction (수량 was struck out and replaced), set "printedQty" = the ORIGINAL printed number that was struck out. When no correction was applied, set "printedQty" = "". This field lets the system count how many corrections were found — never leave it out.
- MOST-MISSED CASE — check every row for it: a struck 수량 with a small red "0" written to its right means the item was cancelled / is out of stock, so the corrected 수량 is 0. Faint or tiny right-side digits — the "0" most of all — are the single most commonly overlooked correction. Deliberately scan the right edge of EVERY 수량 cell for one before concluding the printed number is unchanged.
- Examples:
  · printed 수량 "5" struck through, "1" handwritten to its right (가용) → 수량="1", 가용="", printedQty="5"
  · printed 수량 "2" crossed out, "0" handwritten to its right → 수량="0", 가용="", printedQty="2"
  · printed 수량 "100" struck out, "84" then "100" handwritten to its right (84 superseded by the final 100) → 수량="100", 가용="", printedQty="100"
  · a handwritten number to the LEFT of the printed 수량 → ignore it, keep the printed 수량, printedQty=""
  · printed 수량 circled or check-marked but not struck out → keep the printed number, printedQty="" 

IMAGES YOU RECEIVE:
- The FIRST image is the full page — use it for the table structure and row order.
- The following images are zoomed horizontal strips of the SAME page, top to bottom, with overlap between neighbouring strips. Use them to read small digits (바코드, 수량) and pen marks precisely.
- A row inside an overlap appears in two strips — output every printed row exactly ONCE, in full-page order.

ROW ALIGNMENT — the most important structural rule:
- Read each row strictly along its own horizontal line. The 등록상품명, 옵션, 바코드 and 수량 of one output row MUST all come from the same printed line.
- The 바코드 is the anchor of a row: after reading a row, re-check that its 등록상품명/옵션 are the cells on the same line as that barcode, not the line above or below.

DIGIT ACCURACY:
- Printed digits are small. Deliberately distinguish look-alike digits using the zoomed strips: 2 vs 5, 1 vs 7, 3 vs 8, 6 vs 8 vs 0, 4 vs 9.
- Read every digit of 수량 and 바코드 from the zoomed strip, not only the full page.
- If a digit is still ambiguous after zooming, do NOT guess it (see NEVER FABRICATE below) — transcribe what you can see and set that row's confidence to 0.4 or below.

OTHER:
- Include every printed data row that has a barcode. Rows whose corrected 수량 is 0 are still valid — include them.
- Skip completely blank rows and non-data rows (separators, repeated headers).
- Each row must include "confidence" as string "0.0" to "1.0". Confidence is driven ABOVE ALL by barcode legibility: NEVER guess or infer a barcode digit. If even one digit is blurry, ambiguous, or you are not fully certain of the ENTIRE barcode, transcribe only what you can actually see and set confidence LOW (0.4 or below) for that row. A barcode you had to guess, complete, or reconstruct is a low-confidence row, not a high-confidence one. It is far better to report an uncertain/partial barcode with low confidence than to output a confident-looking barcode that is wrong.
- Box-number titles like "박스 - 15" / "박스-14" → metadata.boxNumbers. Do not put them in rows.
- NEVER FABRICATE. Transcribe only what is actually printed/visible. Do not invent, guess, complete, duplicate, or "normalize" a 바코드 or a 수량. If a barcode is partly illegible, transcribe ONLY the digits you can clearly read and lower that row's confidence — do NOT fill in missing digits or nudge it toward a similar barcode (these codes often differ only in the last digit, so a guess silently becomes a different product). Do not add rows that are not printed, and do not split or merge printed rows — the number of output rows must equal the number of printed data rows you can actually see.`;

export function buildExtractUserPrompt(stripCount: number): string {
  return `Image 1 is the full packing-list page. Images 2-${stripCount + 1} are zoomed horizontal strips of the same page (top to bottom, overlapping). Extract all table rows.`;
}

export function buildArbitrationUserPrompt(
  disputesJson: string,
  stripCount: number,
): string {
  return `Image 1 is the full packing-list page. Images 2-${stripCount + 1} are zoomed horizontal strips of the same page (top to bottom, overlapping).

Two independent transcriptions of this page disagree on the rows below. For each item, "a" and "b" are the two readings (null = that transcription had no such row).

${disputesJson}

For EVERY item, locate the printed row in the image (use the zoomed strips) and decide from the image itself — do not assume either reading is right:
- "exists": false only if no printed data row with that barcode exists on the page (a misread barcode that matches another row counts as not existing).
- "바코드": the barcode exactly as printed (digits only).
- "수량": the final quantity, applying the 수량 correction rule (struck-out printed number → handwritten number to its right).
- "printedQty": the struck-out printed number when a correction applies, otherwise "".
- Check look-alike digits carefully: 2 vs 5, 1 vs 7, 3 vs 8, 6 vs 8 vs 0, 4 vs 9.
- NEVER FABRICATE: do not guess, complete, or nudge a barcode toward a similar one. These barcodes often differ only in the last digit(s), so a guessed digit silently becomes a DIFFERENT product.

This task replaces the output shape given in the system instructions (the transcription rules still apply). Return ONLY JSON (no markdown fences):
{ "decisions": [ { "id": string, "exists": boolean, "바코드": string, "수량": string, "printedQty": string } ] }`;
}

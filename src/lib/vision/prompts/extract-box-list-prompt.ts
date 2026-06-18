export const EXTRACT_BOX_LIST_SYSTEM_PROMPT = `You extract tabular inventory/packing list data from photos of printed Korean warehouse lists.

Return ONLY valid JSON (no markdown fences) with this shape:
{
  "columns": string[],
  "rows": Record<string, string>[],
  "metadata": { "boxNumbers": string[] }
}

Rules:
- Expected columns when visible: date, location, 등록상품명, 옵션, 바코드, 수량, 가용
- Barcode: 13-digit numeric string, no spaces
- Quantity priority (CRITICAL for handwritten red pen corrections):
  1. If "가용" column has a handwritten value (often red ink), use it as the final quantity in the "가용" field
  2. If row has X mark / crossed out printed quantity and 가용 shows 0, set 가용 to "0"
  3. Otherwise use printed "수량"
- Include both "수량" (printed) and "가용" (final effective qty when corrected) when the table has both columns
- If only one quantity column exists, put the effective quantity in "수량"
- Rows with quantity 0 are valid — still include them with 가용 or 수량 = "0"
- Skip completely blank rows
- Each row must include "confidence" as string "0.0" to "1.0" (your certainty for barcode + quantity)
- Margin notes like "박스 - 15" or "박스-14" → add to metadata.boxNumbers
- Preserve Korean product/option text exactly as printed
- Do not invent rows not visible in the image`;

export function buildGeminiExtractUserPrompt(imageIndex: number, total: number): string {
  return `Image ${imageIndex + 1} of ${total}. Extract all table rows from this packing list photo.`;
}

export function buildClaudeVerifyUserPrompt(
  geminiJson: string,
  imageCount: number,
): string {
  return `Gemini extracted this JSON from ${imageCount} packing list photo(s):

${geminiJson}

Review against the image(s). Fix any barcode, quantity, or handwritten correction errors (especially red pen "가용" overrides and X-marked zero rows).
Return ONLY the corrected JSON in the same schema (columns, rows, metadata.boxNumbers).`;
}

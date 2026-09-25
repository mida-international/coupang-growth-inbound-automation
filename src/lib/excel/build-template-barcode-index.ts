import "server-only";

import ExcelJS from "exceljs";

import {
  normalizeBarcodeDigits,
  normalizeText,
  type MasterBarcodeIndex,
  type MasterEntry,
} from "@/lib/vision/correct-barcodes-against-master";

// WING 입고 템플릿 열(1-indexed, filter-inbound-template.ts 의 INBOUND_LAYOUT 와 일치):
// B(2)=등록상품명, C(3)=옵션명, AB(28)=상품바코드. 데이터는 5행부터.
const NAME_COL = 2;
const OPTION_COL = 3;
const BARCODE_COL = 28;
const DATA_START_ROW = 5;

function cellText(row: ExcelJS.Row, col: number): string {
  const value = row.getCell(col).value;
  return value != null ? String(value).trim() : "";
}

/**
 * WING 입고 템플릿 xlsx 에서 (상품명, 옵션, 바코드) 마스터 인덱스를 만든다.
 * 바코드 교정(correctVisionBarcodesAgainstMaster)에 쓰인다.
 */
export async function buildMasterBarcodeIndex(
  templateBuffer: ArrayBuffer | Buffer,
): Promise<MasterBarcodeIndex> {
  const workbook = new ExcelJS.Workbook();
  const data = Buffer.isBuffer(templateBuffer)
    ? templateBuffer
    : Buffer.from(templateBuffer);
  await workbook.xlsx.load(data as unknown as ExcelJS.Buffer);

  const barcodeSet = new Set<string>();
  const entries: MasterEntry[] = [];
  // 상품명옵션 키 → 바코드. 같은 키가 서로 다른 바코드를 가리키면 애매하므로 제거한다.
  const keyToBarcode = new Map<string, string>();
  const ambiguousKeys = new Set<string>();

  workbook.eachSheet((worksheet) => {
    if (
      worksheet.name.includes("사용법") ||
      worksheet.name.includes("유의사항")
    ) {
      return;
    }

    for (let rowIndex = DATA_START_ROW; rowIndex <= worksheet.rowCount; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex);
      const barcode = normalizeBarcodeDigits(cellText(row, BARCODE_COL));
      if (!barcode) {
        continue;
      }

      barcodeSet.add(barcode);

      const name = normalizeText(cellText(row, NAME_COL));
      const option = normalizeText(cellText(row, OPTION_COL));
      if (!name && !option) {
        continue;
      }

      entries.push({ name, option, barcode });

      const key = `${name}${option}`;
      const existing = keyToBarcode.get(key);
      if (existing === undefined) {
        keyToBarcode.set(key, barcode);
      } else if (existing !== barcode) {
        ambiguousKeys.add(key);
      }
    }
  });

  for (const key of ambiguousKeys) {
    keyToBarcode.delete(key);
  }

  return { barcodeSet, byNameOption: keyToBarcode, entries };
}

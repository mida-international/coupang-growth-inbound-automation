import ExcelJS from "exceljs";

import { SHOPLING_OUTBOUND_LAYOUT } from "@/lib/excel/targets/shopling-gross-outbound-template";
import { validateShoplingOutboundTemplateFile } from "@/lib/excel/validators/validate-shopling-outbound-template";
import type { OutboundDeductRow } from "@/services/deliverables/types";

function getMainWorksheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const sheet =
    workbook.getWorksheet(SHOPLING_OUTBOUND_LAYOUT.sheetName) ??
    workbook.worksheets[0];

  if (!sheet) {
    throw new Error("Sheet1 워크시트를 찾을 수 없습니다.");
  }

  return sheet;
}

export async function fillShoplingOutboundTemplate(
  templateBuffer: Buffer,
  rows: OutboundDeductRow[],
): Promise<Buffer> {
  const validationError = validateShoplingOutboundTemplateFile(templateBuffer);

  if (validationError) {
    throw new Error(`[샵플링 출고 템플릿 오류] ${validationError}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer as unknown as ExcelJS.Buffer);

  const sheet = getMainWorksheet(workbook);
  const lastUsed = sheet.lastRow?.number ?? SHOPLING_OUTBOUND_LAYOUT.headerRowCount;

  for (let rowIndex = lastUsed; rowIndex >= SHOPLING_OUTBOUND_LAYOUT.dataStartRow; rowIndex--) {
    sheet.spliceRows(rowIndex, 1);
  }

  let rowNum = SHOPLING_OUTBOUND_LAYOUT.dataStartRow;

  for (const { barcode, deductQty } of rows) {
    const excelRow = sheet.getRow(rowNum);
    excelRow.getCell(SHOPLING_OUTBOUND_LAYOUT.barcodeCol).value = barcode;
    excelRow.getCell(SHOPLING_OUTBOUND_LAYOUT.deductQtyCol).value = deductQty;
    rowNum += 1;
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(arrayBuffer);
}

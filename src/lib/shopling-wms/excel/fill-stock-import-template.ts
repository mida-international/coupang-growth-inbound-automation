import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";

import type { NegativeInventoryRow } from "@/lib/shopling-wms/excel/parse-negative-inventory";
import {
  STOCK_IMPORT_LAYOUT,
  getStockImportTemplatePath,
} from "@/lib/shopling-wms/excel/targets/stock-import-template";
import { getShoplingWmsOutputDir } from "@/lib/shopling-wms/paths";

function getMainWorksheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const sheet =
    workbook.getWorksheet(STOCK_IMPORT_LAYOUT.sheetName) ??
    workbook.worksheets[0];

  if (!sheet) {
    throw new Error("Sheet1 워크시트를 찾을 수 없습니다.");
  }

  return sheet;
}

function clearDataRows(sheet: ExcelJS.Worksheet, fromRow: number): void {
  const lastRow = sheet.lastRow?.number ?? fromRow;

  for (let rowIndex = fromRow; rowIndex <= lastRow; rowIndex += 1) {
    const row = sheet.getRow(rowIndex);

    for (
      let col = STOCK_IMPORT_LAYOUT.productCodeCol;
      col <= STOCK_IMPORT_LAYOUT.qtyCol;
      col += 1
    ) {
      row.getCell(col).value = null;
    }

    row.commit();
  }
}

function setTextCell(cell: ExcelJS.Cell, value: string): void {
  cell.value = value;
  cell.numFmt = "@";
}

export type FillStockImportTemplateResult = {
  buffer: Buffer;
  filePath: string;
};

export async function fillStockImportTemplate(
  rows: NegativeInventoryRow[],
  runId: string,
  timestamp: string,
): Promise<FillStockImportTemplateResult> {
  const templateBuffer = await fs.readFile(getStockImportTemplatePath());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer as unknown as ExcelJS.Buffer);

  const sheet = getMainWorksheet(workbook);
  clearDataRows(sheet, STOCK_IMPORT_LAYOUT.dataStartRow);

  let rowNum = STOCK_IMPORT_LAYOUT.dataStartRow;

  for (const row of rows) {
    const excelRow = sheet.getRow(rowNum);
    excelRow.height = STOCK_IMPORT_LAYOUT.rowHeight;
    setTextCell(
      excelRow.getCell(STOCK_IMPORT_LAYOUT.productCodeCol),
      row.productCode,
    );
    setTextCell(
      excelRow.getCell(STOCK_IMPORT_LAYOUT.optionCodeCol),
      row.optionCode,
    );
    excelRow.getCell(STOCK_IMPORT_LAYOUT.qtyCol).value = row.qty;
    excelRow.commit();
    rowNum += 1;
  }

  const outputDir = getShoplingWmsOutputDir(runId);
  const filePath = path.join(outputDir, `stockIpReg_filled_${timestamp}.xlsx`);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  return { buffer, filePath };
}

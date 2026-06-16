import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import ExcelJS from "exceljs";

import { fillShoplingOutboundTemplate } from "@/lib/excel/generators/fill-shopling-outbound-template";
import {
  getShoplingOutboundTemplatePath,
  SHOPLING_OUTBOUND_LAYOUT,
} from "@/lib/excel/targets/shopling-gross-outbound-template";

describe("fillShoplingOutboundTemplate", () => {
  it("keeps header rows and writes barcode and deduct quantity from row 3", async () => {
    const templateBuffer = fs.readFileSync(getShoplingOutboundTemplatePath());
    const rows = [
      { barcode: "8801111111111", deductQty: 10 },
      { barcode: "8802222222222", deductQty: 5 },
    ];

    const outputBuffer = await fillShoplingOutboundTemplate(templateBuffer, rows);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(outputBuffer as unknown as ExcelJS.Buffer);

    const sheet =
      workbook.getWorksheet(SHOPLING_OUTBOUND_LAYOUT.sheetName) ??
      workbook.worksheets[0];

    assert.ok(sheet);
    assert.match(String(sheet.getCell(1, 1).value ?? ""), /바코드/);
    assert.equal(sheet.getCell(3, 1).value, "8801111111111");
    assert.equal(sheet.getCell(3, 4).value, 10);
    assert.equal(sheet.getCell(4, 1).value, "8802222222222");
    assert.equal(sheet.getCell(4, 4).value, 5);
    assert.equal(sheet.getCell(3, 2).value, null);
    assert.equal(sheet.getCell(3, 3).value, null);
  });

  it("removes existing data rows below the header", async () => {
    const templateBuffer = fs.readFileSync(getShoplingOutboundTemplatePath());
    const templateWorkbook = new ExcelJS.Workbook();
    await templateWorkbook.xlsx.load(templateBuffer as unknown as ExcelJS.Buffer);

    const sheet =
      templateWorkbook.getWorksheet(SHOPLING_OUTBOUND_LAYOUT.sheetName) ??
      templateWorkbook.worksheets[0];

    assert.ok(sheet);

    const originalLastRow = sheet.lastRow?.number ?? 0;
    assert.ok(originalLastRow >= SHOPLING_OUTBOUND_LAYOUT.dataStartRow);

    const outputBuffer = await fillShoplingOutboundTemplate(templateBuffer, [
      { barcode: "8803333333333", deductQty: 1 },
    ]);

    const outputWorkbook = new ExcelJS.Workbook();
    await outputWorkbook.xlsx.load(outputBuffer as unknown as ExcelJS.Buffer);

    const outputSheet =
      outputWorkbook.getWorksheet(SHOPLING_OUTBOUND_LAYOUT.sheetName) ??
      outputWorkbook.worksheets[0];

    assert.ok(outputSheet);
    assert.equal(outputSheet.lastRow?.number, SHOPLING_OUTBOUND_LAYOUT.dataStartRow);
    assert.equal(outputSheet.getCell(3, 1).value, "8803333333333");
    assert.equal(outputSheet.getCell(3, 4).value, 1);
  });
});

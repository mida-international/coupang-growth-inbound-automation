import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { describe, it } from "node:test";

import ExcelJS from "exceljs";

import { fillStockImportTemplate } from "@/lib/shopling-wms/excel/fill-stock-import-template";
import { STOCK_IMPORT_LAYOUT } from "@/lib/shopling-wms/excel/targets/stock-import-template";
import { getShoplingWmsOutputDir } from "@/lib/shopling-wms/paths";

describe("fillStockImportTemplate", () => {
  it("fills product code, option code, and qty into template columns B/C/D", async () => {
    const runId = "test-fill-stock-import";
    await fs.mkdir(getShoplingWmsOutputDir(runId), { recursive: true });

    const result = await fillStockImportTemplate(
      [
        { productCode: "12345", optionCode: "67890", qty: 3 },
        { productCode: "99999", optionCode: "", qty: 7 },
      ],
      runId,
      "20260616_120000",
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(result.filePath);

    const sheet = workbook.getWorksheet(STOCK_IMPORT_LAYOUT.sheetName);
    assert.ok(sheet);

    const row3 = sheet.getRow(3);
    assert.equal(row3.getCell(STOCK_IMPORT_LAYOUT.productCodeCol).value, "12345");
    assert.equal(row3.getCell(STOCK_IMPORT_LAYOUT.optionCodeCol).value, "67890");
    assert.equal(row3.getCell(STOCK_IMPORT_LAYOUT.qtyCol).value, 3);
    assert.equal(row3.getCell(STOCK_IMPORT_LAYOUT.productCodeCol).numFmt, "@");

    const row4 = sheet.getRow(4);
    assert.equal(row4.getCell(STOCK_IMPORT_LAYOUT.productCodeCol).value, "99999");
    assert.equal(row4.getCell(STOCK_IMPORT_LAYOUT.qtyCol).value, 7);
  });
});

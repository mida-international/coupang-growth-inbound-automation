import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";

import {
  buildCoupangInboundTemplateFilename,
  generateFilteredInboundTemplate,
} from "@/lib/excel/generators/filter-inbound-template";

const BARCODE_A = "8801111111111";
const BARCODE_B = "8802222222222";
const OPTION_A = "11111111";
const OPTION_B = "22222222";

async function buildWingTemplateBuffer(
  dataRows: Array<{ optionId: string; barcode: string }>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("로켓그로스 입고");

  sheet.getCell(1, 1).value = "안내";
  sheet.getCell(2, 1).value = "헤더";
  sheet.getCell(3, 7).value = "옵션 ID";
  sheet.getCell(3, 28).value = "상품바코드";
  sheet.getCell(4, 1).value = "예시";

  for (let index = 0; index < dataRows.length; index++) {
    const rowNumber = 5 + index;
    sheet.getCell(rowNumber, 7).value = dataRows[index].optionId;
    sheet.getCell(rowNumber, 28).value = dataRows[index].barcode;
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(arrayBuffer);
}

function buildBoxListBuffer(rows: Array<[string, number]>): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["바코드", "수량"],
    ...rows.map(([barcode, quantity]) => [barcode, quantity]),
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

describe("filter-inbound-template", () => {
  it("keeps matched rows, sets V column quantity, and removes unmatched rows", async () => {
    const templateBuffer = await buildWingTemplateBuffer([
      { optionId: OPTION_A, barcode: BARCODE_A },
      { optionId: OPTION_B, barcode: BARCODE_B },
    ]);
    const boxListBuffer = buildBoxListBuffer([[BARCODE_A, 3]]);

    const result = await generateFilteredInboundTemplate(templateBuffer, {
      source: "excel",
      boxListBuffer,
    });

    assert.equal(result.stats.matched, 1);
    assert.equal(result.stats.finalRows, 1);
    assert.deepEqual(result.stats.unmatched, []);
    assert.equal(result.matchedItems.length, 1);
    assert.equal(result.matchedItems[0].productBarcode, BARCODE_A);
    assert.equal(result.matchedItems[0].coupangOptionId, OPTION_A);
    assert.equal(result.matchedItems[0].quantity, 3);

    const outputWorkbook = new ExcelJS.Workbook();
    await outputWorkbook.xlsx.load(
      result.buffer as unknown as ExcelJS.Buffer,
    );
    const sheet = outputWorkbook.getWorksheet("로켓그로스 입고");

    assert.ok(sheet);
    assert.equal(sheet.rowCount, 5);
    assert.equal(String(sheet.getCell(5, 28).value), BARCODE_A);
    assert.equal(sheet.getCell(5, 22).value, 3);
  });

  it("throws when all box list quantities are zero", async () => {
    const templateBuffer = await buildWingTemplateBuffer([
      { optionId: OPTION_A, barcode: BARCODE_A },
    ]);
    const boxListBuffer = buildBoxListBuffer([[BARCODE_A, 0]]);

    await assert.rejects(
      () =>
        generateFilteredInboundTemplate(templateBuffer, {
          source: "excel",
          boxListBuffer,
        }),
      /수량 0 또는 음수/,
    );
  });

  it("throws when no barcodes match the wing template", async () => {
    const templateBuffer = await buildWingTemplateBuffer([
      { optionId: OPTION_A, barcode: BARCODE_A },
    ]);
    const boxListBuffer = buildBoxListBuffer([["9999999999999", 5]]);

    await assert.rejects(
      () =>
        generateFilteredInboundTemplate(templateBuffer, {
          source: "excel",
          boxListBuffer,
        }),
      /찾을 수 없습니다/,
    );
  });

  it("builds filename with excel source tag", () => {
    const filename = buildCoupangInboundTemplateFilename(
      "excel",
      new Date("2026-06-16T00:00:00.000Z"),
    );

    assert.match(filename, /^쿠팡_입고템플릿_생성_엑셀_C_/);
    assert.match(filename, /\.xlsx$/);
  });
});

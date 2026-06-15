import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import {
  buildBarcodeQtyMap,
  parseBoxInboundList,
} from "@/lib/excel/parsers/parse-box-inbound-list";
import { validateBoxListFile } from "@/lib/excel/validators/validate-box-list-file";
import { validateInboundTemplateFile } from "@/lib/excel/validators/validate-inbound-template-file";

function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

function buildBoxListWorkbook(
  rows: unknown[][],
  sheetName = "Sheet1",
): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

  return workbookToBuffer(workbook);
}

function buildWingTemplateWorkbook(dataRowCount = 1): Buffer {
  const headerRow = Array.from({ length: 39 }, () => null);
  headerRow[6] = "옵션 ID";
  headerRow[27] = "상품바코드";

  const dataRow = Array.from({ length: 39 }, () => null);
  dataRow[6] = "12345678";
  dataRow[27] = "8801234567890";

  const rows: unknown[][] = [
    ["안내"],
    ["헤더"],
    headerRow,
    ["예시"],
    ...Array.from({ length: dataRowCount }, () => [...dataRow]),
  ];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "로켓그로스 입고");

  return workbookToBuffer(workbook);
}

describe("parseBoxInboundList", () => {
  it("parses barcode and quantity from Korean headers", () => {
    const buffer = buildBoxListWorkbook([
      ["바코드", "수량"],
      ["8801111111111", 3],
      ["8802222222222", 7],
    ]);

    assert.equal(validateBoxListFile(buffer), null);

    const { items, skippedRows } = parseBoxInboundList(buffer);

    assert.equal(items.length, 2);
    assert.equal(items[0].barcode, "8801111111111");
    assert.equal(items[0].quantity, 3);
    assert.equal(items[1].barcode, "8802222222222");
    assert.equal(items[1].quantity, 7);
    assert.equal(skippedRows, 0);
  });

  it("sums duplicate barcodes in buildBarcodeQtyMap", () => {
    const map = buildBarcodeQtyMap([
      { barcode: "1234567890123", quantity: 2 },
      { barcode: "1234567890123", quantity: 3 },
      { barcode: "9999999999999", quantity: 0 },
    ]);

    assert.equal(map.get("1234567890123"), 5);
    assert.equal(map.has("9999999999999"), false);
  });

  it("excludes zero-quantity rows from buildBarcodeQtyMap", () => {
    const map = buildBarcodeQtyMap([
      { barcode: "1111111111111", quantity: 0 },
      { barcode: "2222222222222", quantity: 4 },
    ]);

    assert.equal(map.has("1111111111111"), false);
    assert.equal(map.get("2222222222222"), 4);
  });
});

describe("validateBoxListFile", () => {
  it("returns error when required columns are missing", () => {
    const buffer = buildBoxListWorkbook([
      ["상품명", "비고"],
      ["샘플", "메모"],
    ]);

    const error = validateBoxListFile(buffer);

    assert.ok(error);
    assert.match(error, /필수 컬럼/);
  });

  it("accepts a valid box list file", () => {
    const buffer = buildBoxListWorkbook([
      ["바코드", "수량"],
      ["8801111111111", 1],
    ]);

    assert.equal(validateBoxListFile(buffer), null);
  });

  it("detects swapped wing template upload", () => {
    const buffer = buildBoxListWorkbook(
      [
        ["등록상품명", "옵션 ID"],
        ["상품A", "123"],
      ],
      "로켓그로스 입고",
    );

    const error = validateBoxListFile(buffer);

    assert.ok(error);
    assert.match(error, /WING 원본 입고 템플릿/);
  });
});

describe("validateInboundTemplateFile", () => {
  it("accepts minimal wing template mock", () => {
    const buffer = buildWingTemplateWorkbook(1);

    assert.equal(validateInboundTemplateFile(buffer), null);
  });

  it("rejects narrow box-list-like workbook", () => {
    const buffer = buildBoxListWorkbook([
      ["바코드", "수량", "상품명", "옵션", "박스", "로케이션", "비고", "메모", "비고2", "비고3"],
      ["8801111111111", 1, "A", "B", "1", "L1", "", "", "", ""],
    ]);

    const error = validateInboundTemplateFile(buffer);

    assert.ok(error);
    assert.match(error, /박스 입고 리스트|컬럼 수가 너무 적습니다/);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import {
  normalizeOutboundBoxItems,
  normalizeOutboundBoxListFromBuffer,
} from "@/lib/deliverables/normalize-outbound-box-items";
import { SHOPLING_DUMMY_BARCODE } from "@/lib/excel/targets/shopling-gross-outbound-template";

function buildBoxListWorkbook(rows: unknown[][]): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

describe("normalizeOutboundBoxItems", () => {
  it("maps a single barcode with positive quantity", () => {
    const result = normalizeOutboundBoxItems([
      { barcode: "8801111111111", quantity: 10 },
    ]);

    assert.equal(result.qtyByBarcode.get("8801111111111"), 10);
    assert.equal(result.inputBarcodes, 1);
    assert.equal(result.inputWithQty, 1);
    assert.equal(result.skippedDummy, 0);
  });

  it("sums duplicate barcodes", () => {
    const result = normalizeOutboundBoxItems([
      { barcode: "8801111111111", quantity: 5 },
      { barcode: "8801111111111", quantity: 5 },
    ]);

    assert.equal(result.qtyByBarcode.get("8801111111111"), 10);
    assert.equal(result.inputBarcodes, 1);
    assert.equal(result.inputWithQty, 2);
  });

  it("excludes dummy barcode and counts skippedDummy", () => {
    const result = normalizeOutboundBoxItems([
      { barcode: SHOPLING_DUMMY_BARCODE, quantity: 10 },
      { barcode: "8802222222222", quantity: 3 },
    ]);

    assert.equal(result.qtyByBarcode.has(SHOPLING_DUMMY_BARCODE), false);
    assert.equal(result.qtyByBarcode.get("8802222222222"), 3);
    assert.equal(result.skippedDummy, 1);
    assert.equal(result.inputBarcodes, 1);
  });

  it("excludes zero and negative quantities", () => {
    const result = normalizeOutboundBoxItems([
      { barcode: "8801111111111", quantity: 0 },
      { barcode: "8802222222222", quantity: -1 },
      { barcode: "8803333333333", quantity: 4 },
    ]);

    assert.equal(result.qtyByBarcode.has("8801111111111"), false);
    assert.equal(result.qtyByBarcode.has("8802222222222"), false);
    assert.equal(result.qtyByBarcode.get("8803333333333"), 4);
    assert.equal(result.inputWithQty, 1);
  });
});

describe("normalizeOutboundBoxListFromBuffer", () => {
  it("validates, parses, and normalizes a box list buffer", () => {
    const buffer = buildBoxListWorkbook([
      ["바코드", "수량"],
      ["8801111111111", 2],
      ["8801111111111", 3],
      ["8802222222222", 7],
    ]);

    const result = normalizeOutboundBoxListFromBuffer(buffer);

    assert.equal(result.qtyByBarcode.get("8801111111111"), 5);
    assert.equal(result.qtyByBarcode.get("8802222222222"), 7);
    assert.equal(result.inputBarcodes, 2);
    assert.equal(result.inputTotal, 3);
    assert.equal(result.inputWithQty, 3);
  });

  it("throws when required columns are missing", () => {
    const buffer = buildBoxListWorkbook([
      ["상품명", "비고"],
      ["샘플", "메모"],
    ]);

    assert.throws(
      () => normalizeOutboundBoxListFromBuffer(buffer),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /\[출고 리스트 오류\]/);

        return true;
      },
    );
  });
});

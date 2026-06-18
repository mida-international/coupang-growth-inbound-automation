import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import {
  parseCenterSeparation,
  parseCenterSeparationFromRows,
} from "@/lib/excel/parsers/parse-center-separation";
import { CENTER_SEPARATION_EXCEL_HEADERS } from "@/lib/excel/targets/center-separation";

function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

function buildWorkbook(rows: Record<string, string>[]): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: [...CENTER_SEPARATION_EXCEL_HEADERS],
  });
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

  return workbookToBuffer(workbook);
}

describe("parseCenterSeparation", () => {
  it("parses rows with barcode header only", () => {
    const buffer = buildWorkbook([
      { 바코드: "8801234567890" },
      { 바코드: "8801234567891" },
    ]);

    const result = parseCenterSeparation(buffer);

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.rows.length, 2);
    assert.deepEqual(result.rows[0], { barcode: "8801234567890" });
    assert.equal(result.skippedEmptyBarcode, 0);
  });

  it("skips rows with empty barcode", () => {
    const result = parseCenterSeparationFromRows([
      { 바코드: "" },
      { 바코드: "8801234567891" },
    ]);

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0]?.barcode, "8801234567891");
    assert.equal(result.skippedEmptyBarcode, 1);
  });

  it("returns error when barcode header is missing", () => {
    const result = parseCenterSeparationFromRows([{ 상품명: "상품A" }]);

    assert.equal(result.ok, false);

    if (result.ok) {
      return;
    }

    assert.match(result.error, /바코드/);
  });

  it("accepts barcode alias header", () => {
    const result = parseCenterSeparationFromRows([
      { barcode: "8801234567890" },
    ]);

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.rows[0]?.barcode, "8801234567890");
  });

  it("normalizes whitespace in barcode cells", () => {
    const result = parseCenterSeparationFromRows([
      { 바코드: " 8801234567890 " },
      { 바코드: "8801 2345 67890" },
      { 바코드: "   " },
    ]);

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.rows.length, 2);
    assert.deepEqual(result.rows[0], { barcode: "8801234567890" });
    assert.deepEqual(result.rows[1], { barcode: "8801234567890" });
    assert.equal(result.skippedEmptyBarcode, 1);
  });
});

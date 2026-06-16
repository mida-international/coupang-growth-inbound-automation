import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import { fillShoplingInboundOriginalFile } from "@/lib/excel/generators/fill-shopling-inbound-original";

function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

function buildInboundListWorkbook(rows: unknown[][]): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

  return workbookToBuffer(workbook);
}

function readCell(
  buffer: Buffer,
  rowIndex: number,
  colIndex: number,
): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]]!;
  const cell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })];

  if (cell?.v == null) {
    return "";
  }

  return String(cell.v).trim();
}

const inventoryRows = [
  {
    ptnGoodsCd: "CODE-001",
    productName: "气泡袋",
    optionValue: "白色,20*30",
    barcode: "8801111111111",
    location: "A-01",
  },
  {
    ptnGoodsCd: "CODE-002",
    productName: "테이프",
    optionValue: "단품",
    barcode: "8802222222222",
    location: null,
  },
];

describe("fillShoplingInboundOriginalFile", () => {
  it("fills C and F when product and option match with location", () => {
    const buffer = buildInboundListWorkbook([
      ["CT/NO", "", "", "品名", "옵션", "", "", "", "总数量"],
      ["", "", "", "气泡袋", "白色，20*30", "", "", "", 210],
    ]);

    const result = fillShoplingInboundOriginalFile(buffer, inventoryRows);

    assert.equal(readCell(result.buffer, 1, 2), "A-01");
    assert.equal(readCell(result.buffer, 1, 5), "8801111111111");
    assert.equal(readCell(result.buffer, 1, 8), "210");
    assert.equal(result.stats.matched, 1);
  });

  it("fills F only when location is null", () => {
    const buffer = buildInboundListWorkbook([
      ["CT/NO", "", "", "品名", "옵션", "", "", "", "总数量"],
      ["", "", "", "테이프", "단품", "", "", "", ""],
    ]);

    const result = fillShoplingInboundOriginalFile(buffer, inventoryRows);

    assert.equal(readCell(result.buffer, 1, 2), "");
    assert.equal(readCell(result.buffer, 1, 5), "8802222222222");
    assert.equal(result.stats.matched, 1);
  });

  it("matches without I column quantity", () => {
    const buffer = buildInboundListWorkbook([
      ["CT/NO", "", "", "品名", "옵션", "", "", "", "总数量"],
      ["", "", "", "테이프", "단품", "", "", "", ""],
    ]);

    const result = fillShoplingInboundOriginalFile(buffer, inventoryRows);

    assert.equal(result.stats.matched, 1);
    assert.equal(readCell(result.buffer, 1, 5), "8802222222222");
  });

  it("clears C and F for unmapped rows", () => {
    const buffer = buildInboundListWorkbook([
      ["CT/NO", "", "", "", "옵션", "", "", "", "总数量"],
      ["", "old-loc", "", "없는상품", "옵션", "old-barcode", "", "", 10],
    ]);

    const result = fillShoplingInboundOriginalFile(buffer, inventoryRows);

    assert.equal(readCell(result.buffer, 1, 2), "");
    assert.equal(readCell(result.buffer, 1, 5), "");
    assert.equal(result.stats.unmapped, 1);
  });

  it("keeps duplicate barcodes as separate rows", () => {
    const buffer = buildInboundListWorkbook([
      ["CT/NO", "", "", "品名", "옵션", "", "", "", "总数量"],
      ["", "", "", "气泡袋", "白色，20*30", "", "", "", 10],
      ["", "", "", "气泡袋", "白色，20*30", "", "", "", 5],
    ]);

    const result = fillShoplingInboundOriginalFile(buffer, inventoryRows);

    assert.equal(readCell(result.buffer, 1, 5), "8801111111111");
    assert.equal(readCell(result.buffer, 2, 5), "8801111111111");
    assert.equal(result.stats.matched, 2);
  });
});

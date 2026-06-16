import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import { parseShoplingInboundList } from "@/lib/excel/parsers/parse-shopling-inbound-list";
import { validateShoplingInboundListFile } from "@/lib/excel/validators/validate-shopling-inbound-list-file";

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

describe("parseShoplingInboundList", () => {
  it("reads D/E/I columns and preserves row order without merging duplicates", () => {
    const buffer = buildInboundListWorkbook([
      ["收货人", "", "", "0519잡화입고리스트"],
      [],
      ["CT/NO", "", "", "品名", "옵션", "", "", "", "总数量"],
      ["", "", "", "气泡袋", "白色，20*30", "", "", "", 210],
      ["", "", "", "气泡袋", "白色，26*30", "", "", "", 160],
      ["", "", "", "气泡袋", "白色，26*30", "", "", "", 40],
      ["", "", "", "", "옵션만 있음", "", "", "", 10],
      ["", "", "", "품명만", "", "", "", "", ""],
    ]);

    const result = parseShoplingInboundList(buffer);

    assert.equal(result.items.length, 3);
    assert.deepEqual(result.items[0], {
      ptnGoodsCd: "气泡袋",
      optionValue: "白色，20*30",
      quantity: 210,
    });
    assert.deepEqual(result.items[1], {
      ptnGoodsCd: "气泡袋",
      optionValue: "白色，26*30",
      quantity: 160,
    });
    assert.deepEqual(result.items[2], {
      ptnGoodsCd: "气泡袋",
      optionValue: "白色，26*30",
      quantity: 40,
    });
    assert.equal(result.skippedRows, 4);
  });

  it("validates that at least one usable row exists", () => {
    const emptyBuffer = buildInboundListWorkbook([
      ["", "", "", "品名", "", "", "", "", "总数量"],
    ]);

    assert.match(
      validateShoplingInboundListFile(emptyBuffer) ?? "",
      /유효한 D열/,
    );

    const validBuffer = buildInboundListWorkbook([
      ["", "", "", "품명", "옵션", "", "", "", "수량"],
      ["", "", "", "테스트상품", "옵션A", "", "", "", 3],
    ]);

    assert.equal(validateShoplingInboundListFile(validBuffer), null);
  });
});

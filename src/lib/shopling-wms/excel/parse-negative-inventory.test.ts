import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseNegativeInventorySheetRows } from "@/lib/shopling-wms/excel/parse-negative-inventory";

describe("parseNegativeInventorySheetRows", () => {
  it("parses product, option, and absolute stock quantity from D/E/W columns", () => {
    const rows = [
      ["header"],
      ["", "", "", "P001", "O001", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-3"],
      ["", "", "", "P002", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-5"],
      ["", "", "", "", "O003", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-1"],
    ];

    const result = parseNegativeInventorySheetRows(rows);

    assert.equal(result.empty, false);
    assert.equal(result.rows.length, 2);
    assert.deepEqual(result.rows[0], {
      productCode: "P001",
      optionCode: "O001",
      qty: 3,
    });
    assert.deepEqual(result.rows[1], {
      productCode: "P002",
      optionCode: "",
      qty: 5,
    });
  });

  it("returns empty when no valid rows exist", () => {
    const result = parseNegativeInventorySheetRows([["header"], ["", "", "", "", "", "", ""]]);

    assert.equal(result.empty, true);
    assert.equal(result.rows.length, 0);
  });
});

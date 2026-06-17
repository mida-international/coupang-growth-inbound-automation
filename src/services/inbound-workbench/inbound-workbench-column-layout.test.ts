import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_COLUMN_ORDER,
  getDefaultColumnLayout,
  normalizeColumnLayout,
  type InboundWorkbenchColumnLayout,
} from "@/services/inbound-workbench/inbound-workbench-column-layout";

describe("normalizeColumnLayout", () => {
  it("returns defaults for empty input", () => {
    assert.deepEqual(normalizeColumnLayout(null), getDefaultColumnLayout());
  });

  it("removes invalid column ids and appends missing columns", () => {
    const result = normalizeColumnLayout({
      columnOrder: ["invalid", "productBarcode", "registeredProductName"] as unknown as InboundWorkbenchColumnLayout["columnOrder"],
      columnWidths: {},
    });

    assert.deepEqual(result.columnOrder.slice(0, 3), [
      "productBarcode",
      "registeredProductName",
      "optionName",
    ]);
    assert.equal(result.columnOrder.length, DEFAULT_COLUMN_ORDER.length);
  });

  it("clamps column widths to minimum", () => {
    const result = normalizeColumnLayout({
      columnOrder: DEFAULT_COLUMN_ORDER,
      columnWidths: {
        productBarcode: 20,
        registeredProductName: 200,
      },
    });

    assert.equal(result.columnWidths.productBarcode, 64);
    assert.equal(result.columnWidths.registeredProductName, 200);
  });
});

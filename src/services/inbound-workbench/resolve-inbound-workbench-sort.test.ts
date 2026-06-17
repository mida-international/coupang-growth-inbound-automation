import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cycleInboundWorkbenchSort,
  parseInboundWorkbenchSort,
} from "@/services/inbound-workbench/inbound-workbench-sort";

describe("parseInboundWorkbenchSort", () => {
  it("returns default for invalid sort keys", () => {
    assert.deepEqual(parseInboundWorkbenchSort("invalid", "desc"), {
      sort: null,
      dir: null,
    });
  });

  it("returns default when direction is invalid", () => {
    assert.deepEqual(parseInboundWorkbenchSort("productBarcode", "up"), {
      sort: null,
      dir: null,
    });
  });

  it("parses valid sort and direction", () => {
    assert.deepEqual(parseInboundWorkbenchSort("shoplingAvailableStock", "asc"), {
      sort: "shoplingAvailableStock",
      dir: "asc",
    });
  });
});

describe("cycleInboundWorkbenchSort", () => {
  it("starts with descending when switching columns", () => {
    assert.deepEqual(
      cycleInboundWorkbenchSort("productBarcode", "asc", "shoplingAvailableStock"),
      { sort: "shoplingAvailableStock", dir: "desc" },
    );
  });

  it("cycles default to desc to asc to default on the same column", () => {
    assert.deepEqual(
      cycleInboundWorkbenchSort(null, null, "productBarcode"),
      { sort: "productBarcode", dir: "desc" },
    );
    assert.deepEqual(
      cycleInboundWorkbenchSort("productBarcode", "desc", "productBarcode"),
      { sort: "productBarcode", dir: "asc" },
    );
    assert.deepEqual(
      cycleInboundWorkbenchSort("productBarcode", "asc", "productBarcode"),
      { sort: null, dir: null },
    );
  });
});

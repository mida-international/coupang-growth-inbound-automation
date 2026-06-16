import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  decomposeOutboundDeductRows,
  type OutboundDecomposeContext,
} from "@/lib/deliverables/decompose-outbound-deduct-rows";

function buildContext(
  overrides: Partial<OutboundDecomposeContext> = {},
): OutboundDecomposeContext {
  return {
    goodsTpByBarcode: new Map(),
    packageMappingsByBarcode: new Map(),
    ...overrides,
  };
}

describe("decomposeOutboundDeductRows", () => {
  it("keeps a general goods barcode as a single deduct row", () => {
    const result = decomposeOutboundDeductRows(
      new Map([["8801111111111", 10]]),
      buildContext({
        goodsTpByBarcode: new Map([["8801111111111", "G"]]),
      }),
    );

    assert.deepEqual(result.rows, [
      { barcode: "8801111111111", deductQty: 10 },
    ]);
    assert.equal(result.stats.outputRows, 1);
    assert.equal(result.stats.packagesDecomposed, 0);
  });

  it("treats missing goods_tp as a single item", () => {
    const result = decomposeOutboundDeductRows(
      new Map([["8801111111111", 10]]),
      buildContext(),
    );

    assert.deepEqual(result.rows, [
      { barcode: "8801111111111", deductQty: 10 },
    ]);
  });

  it("decomposes a package into single barcodes using map_cnt", () => {
    const result = decomposeOutboundDeductRows(
      new Map([["880PKG0000001", 10]]),
      buildContext({
        goodsTpByBarcode: new Map([["880PKG0000001", "S"]]),
        packageMappingsByBarcode: new Map([
          [
            "880PKG0000001",
            [
              { singleBarcode: "880BBB0000001", mapCnt: 2 },
              { singleBarcode: "880CCC0000001", mapCnt: 1 },
            ],
          ],
        ]),
      }),
    );

    assert.deepEqual(result.rows, [
      { barcode: "880BBB0000001", deductQty: 20 },
      { barcode: "880CCC0000001", deductQty: 10 },
    ]);
    assert.equal(result.stats.packagesDecomposed, 1);
    assert.equal(result.stats.outputRows, 2);
  });

  it("skips package barcodes without mapping", () => {
    const result = decomposeOutboundDeductRows(
      new Map([["880PKG0000001", 10]]),
      buildContext({
        goodsTpByBarcode: new Map([["880PKG0000001", "S"]]),
      }),
    );

    assert.deepEqual(result.rows, []);
    assert.deepEqual(result.stats.skippedUnmappedPackages, ["880PKG0000001"]);
  });

  it("aggregates the same single barcode from multiple packages", () => {
    const result = decomposeOutboundDeductRows(
      new Map([
        ["880PKG0000001", 10],
        ["880PKG0000002", 5],
      ]),
      buildContext({
        goodsTpByBarcode: new Map([
          ["880PKG0000001", "S"],
          ["880PKG0000002", "S"],
        ]),
        packageMappingsByBarcode: new Map([
          ["880PKG0000001", [{ singleBarcode: "880BBB0000001", mapCnt: 2 }]],
          ["880PKG0000002", [{ singleBarcode: "880BBB0000001", mapCnt: 1 }]],
        ]),
      }),
    );

    assert.deepEqual(result.rows, [
      { barcode: "880BBB0000001", deductQty: 25 },
    ]);
    assert.equal(result.stats.packagesDecomposed, 2);
  });

  it("ignores package components with non-positive map_cnt", () => {
    const result = decomposeOutboundDeductRows(
      new Map([["880PKG0000001", 10]]),
      buildContext({
        goodsTpByBarcode: new Map([["880PKG0000001", "S"]]),
        packageMappingsByBarcode: new Map([
          [
            "880PKG0000001",
            [
              { singleBarcode: "880BBB0000001", mapCnt: 0 },
              { singleBarcode: "880CCC0000001", mapCnt: 1 },
            ],
          ],
        ]),
      }),
    );

    assert.deepEqual(result.rows, [
      { barcode: "880CCC0000001", deductQty: 10 },
    ]);
  });
});

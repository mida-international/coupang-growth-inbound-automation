import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  flagImplausibleQuantities,
  IMPLAUSIBLE_QTY_CONFIDENCE,
  isImplausibleQuantity,
} from "@/lib/vision/flag-implausible-quantity";

function row(qty: string, printedQty: string, confidence = "0.95"): Record<string, string> {
  return { 바코드: "2016342603142", 수량: qty, printedQty, confidence };
}

describe("isImplausibleQuantity", () => {
  it("flags the real 9/3 case: printed 12 read as 87", () => {
    assert.equal(isImplausibleQuantity(row("87", "12")), true);
  });

  it("flags a value at least double and 3+ more than printed", () => {
    assert.equal(isImplausibleQuantity(row("10", "5")), true);
    assert.equal(isImplausibleQuantity(row("4", "1")), true);
  });

  it("does not flag small increases (no general increase warning)", () => {
    assert.equal(isImplausibleQuantity(row("6", "5")), false);
    assert.equal(isImplausibleQuantity(row("3", "1")), false);
    assert.equal(isImplausibleQuantity(row("9", "5")), false);
  });

  it("does not flag normal corrections, restores or rows without a printed number", () => {
    assert.equal(isImplausibleQuantity(row("7", "12")), false);
    assert.equal(isImplausibleQuantity(row("0", "4")), false);
    assert.equal(isImplausibleQuantity(row("100", "100")), false);
    assert.equal(isImplausibleQuantity(row("87", "")), false);
    assert.equal(isImplausibleQuantity(row("87", "0")), false);
  });
});

describe("flagImplausibleQuantities", () => {
  it("lowers confidence only on implausible rows", () => {
    const rows = flagImplausibleQuantities([row("87", "12"), row("7", "12")]);

    assert.equal(rows[0].confidence, IMPLAUSIBLE_QTY_CONFIDENCE);
    assert.equal(rows[1].confidence, "0.95");
    assert.equal(rows[0]["수량"], "87");
  });

  it("keeps an already lower confidence", () => {
    const rows = flagImplausibleQuantities([row("87", "12", "0.2")]);

    assert.equal(rows[0].confidence, "0.2");
  });
});

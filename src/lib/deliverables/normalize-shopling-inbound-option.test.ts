import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShoplingInboundLookupKey,
  compareShoplingInboundOptions,
  normalizeShoplingInboundOption,
  normalizeShoplingInboundOptionExact,
  normalizeShoplingInboundOptionForTier,
  normalizeShoplingInboundOptionIgnoreCase,
  normalizeShoplingInboundOptionIgnoreWhitespace,
} from "@/lib/deliverables/normalize-shopling-inbound-option";

describe("normalizeShoplingInboundOption tiers", () => {
  it("normalizes exact tier with fullwidth commas and comma spacing", () => {
    assert.equal(normalizeShoplingInboundOptionExact("白色，20*30"), "白色,20*30");
    assert.equal(normalizeShoplingInboundOption("白色, 20*30"), "白色,20*30");
    assert.equal(
      normalizeShoplingInboundOptionExact("白色, 20 * 30"),
      "白色,20 * 30",
    );
  });

  it("removes all whitespace at ignoreWhitespace tier", () => {
    assert.equal(
      normalizeShoplingInboundOptionIgnoreWhitespace("白色, 20 * 30"),
      "白色,20*30",
    );
  });

  it("lowercases at ignoreCase tier", () => {
    assert.equal(
      normalizeShoplingInboundOptionIgnoreCase("Red Large"),
      "redlarge",
    );
  });

  it("compares options per tier", () => {
    assert.equal(
      compareShoplingInboundOptions("白色，20*30", "白色,20*30", "exact"),
      true,
    );
    assert.equal(
      compareShoplingInboundOptions("白色, 20 * 30", "白色,20*30", "exact"),
      false,
    );
    assert.equal(
      compareShoplingInboundOptions(
        "白色, 20 * 30",
        "白色,20*30",
        "ignoreWhitespace",
      ),
      true,
    );
    assert.equal(
      compareShoplingInboundOptions("Red Large", "redlarge", "ignoreCase"),
      true,
    );
  });

  it("dispatches normalizeShoplingInboundOptionForTier", () => {
    assert.equal(
      normalizeShoplingInboundOptionForTier("Red Large", "ignoreCase"),
      "redlarge",
    );
  });

  it("builds stable lookup keys for exact option normalization", () => {
    assert.equal(
      buildShoplingInboundLookupKey("气泡袋", "白色，20*30"),
      buildShoplingInboundLookupKey("气泡袋", "白色,20*30"),
    );
  });
});

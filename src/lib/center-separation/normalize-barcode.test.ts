import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeCenterSeparationBarcode } from "@/lib/center-separation/normalize-barcode";

describe("normalizeCenterSeparationBarcode", () => {
  it("trims leading and trailing whitespace", () => {
    assert.equal(normalizeCenterSeparationBarcode(" 8801234567890 "), "8801234567890");
  });

  it("removes internal whitespace", () => {
    assert.equal(
      normalizeCenterSeparationBarcode("8801 2345 67890"),
      "8801234567890",
    );
  });

  it("returns empty string for blank values", () => {
    assert.equal(normalizeCenterSeparationBarcode(""), "");
    assert.equal(normalizeCenterSeparationBarcode("   "), "");
    assert.equal(normalizeCenterSeparationBarcode(null), "");
    assert.equal(normalizeCenterSeparationBarcode(undefined), "");
  });

  it("converts numeric excel values to integer strings", () => {
    assert.equal(normalizeCenterSeparationBarcode(8801234567890), "8801234567890");
  });
});

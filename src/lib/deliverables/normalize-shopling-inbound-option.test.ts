import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShoplingInboundLookupKey,
  compareShoplingInboundOptions,
  compareShoplingInboundProductLabels,
  normalizeShoplingInboundOption,
  normalizeShoplingInboundOptionExact,
  normalizeShoplingInboundOptionForTier,
  normalizeShoplingInboundOptionIgnoreCase,
  normalizeShoplingInboundOptionIgnoreWhitespace,
  normalizeShoplingInboundProductLabel,
  normalizeShoplingInboundProductLabelForTier,
  stripInvisibleCharacters,
} from "@/lib/deliverables/normalize-shopling-inbound-option";

const ZWSP = String.fromCharCode(0x200b);
const BOM = String.fromCharCode(0xfeff);
const SOFT_HYPHEN = String.fromCharCode(0x00ad);
const WORD_JOINER = String.fromCharCode(0x2060);

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

  it("strips zero-width and format characters at every tier", () => {
    const dirty = `白${ZWSP}色, 20 *${WORD_JOINER} 30${BOM}`;

    assert.equal(normalizeShoplingInboundOptionExact(dirty), "白色,20 * 30");
    assert.equal(
      normalizeShoplingInboundOptionIgnoreWhitespace(dirty),
      "白色,20*30",
    );
    assert.equal(
      normalizeShoplingInboundOptionForTier(dirty, "ignoreCase"),
      "白色,20*30",
    );
  });
});

describe("stripInvisibleCharacters", () => {
  it("removes zero-width space, BOM, soft hyphen, and word joiner", () => {
    assert.equal(
      stripInvisibleCharacters(
        `발란스${ZWSP}신발끈${BOM}${SOFT_HYPHEN}${WORD_JOINER}`,
      ),
      "발란스신발끈",
    );
  });

  it("keeps ordinary visible characters and normal spaces intact", () => {
    assert.equal(stripInvisibleCharacters("발란스 신발끈"), "발란스 신발끈");
  });
});

describe("product label tiers", () => {
  it("strips invisible characters before comparing at exact tier", () => {
    assert.equal(
      normalizeShoplingInboundProductLabel(`먼지차단${ZWSP}립스틱정리함`),
      "먼지차단립스틱정리함",
    );
  });

  it("collapses runs of whitespace but keeps a single space at exact tier", () => {
    assert.equal(
      normalizeShoplingInboundProductLabelForTier("발란스  신발끈", "exact"),
      "발란스 신발끈",
    );
  });

  it("removes all whitespace at ignoreWhitespace tier", () => {
    assert.equal(
      normalizeShoplingInboundProductLabelForTier(
        "발란스 신발끈",
        "ignoreWhitespace",
      ),
      "발란스신발끈",
    );
  });

  it("lowercases at ignoreCase tier", () => {
    assert.equal(
      normalizeShoplingInboundProductLabelForTier("Roll Tape", "ignoreCase"),
      "rolltape",
    );
  });

  it("does not equate internal-space differences at exact tier", () => {
    assert.equal(
      compareShoplingInboundProductLabels("발란스 신발끈", "발란스신발끈", "exact"),
      false,
    );
  });

  it("equates internal-space differences at ignoreWhitespace tier", () => {
    assert.equal(
      compareShoplingInboundProductLabels(
        "발란스 신발끈",
        "발란스신발끈",
        "ignoreWhitespace",
      ),
      true,
    );
  });

  it("equates zero-width-only differences even at exact tier", () => {
    assert.equal(
      compareShoplingInboundProductLabels(
        `발란스${ZWSP}신발끈`,
        "발란스신발끈",
        "exact",
      ),
      true,
    );
  });
});

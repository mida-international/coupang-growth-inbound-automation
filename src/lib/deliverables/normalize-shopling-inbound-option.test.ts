import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShoplingInboundLookupKey,
  normalizeShoplingInboundOption,
} from "@/lib/deliverables/normalize-shopling-inbound-option";

describe("normalizeShoplingInboundOption", () => {
  it("normalizes fullwidth commas", () => {
    assert.equal(normalizeShoplingInboundOption("白色，20*30"), "白色,20*30");
  });

  it("builds stable lookup keys", () => {
    assert.equal(
      buildShoplingInboundLookupKey("气泡袋", "白色，20*30"),
      buildShoplingInboundLookupKey("气泡袋", "白色,20*30"),
    );
  });
});

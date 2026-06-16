import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildShoplingOutboundFilename } from "@/lib/excel/generators/build-shopling-outbound-filename";

describe("buildShoplingOutboundFilename", () => {
  it("formats KST date as YYYYMMDD suffix", () => {
    const filename = buildShoplingOutboundFilename(
      new Date("2026-06-16T00:00:00.000Z"),
    );

    assert.equal(filename, "shopling_gross_outbound_20260616.xlsx");
  });
});

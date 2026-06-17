import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildWorkbenchQuery } from "@/components/inbound-workbench/build-workbench-query";

describe("buildWorkbenchQuery", () => {
  it("appends multiple seller params", () => {
    const query = buildWorkbenchQuery({
      sellers: ["seller-1", "seller-2"],
      q: "test",
    });

    assert.equal(
      query,
      "?seller=seller-1&seller=seller-2&q=test",
    );
  });
});

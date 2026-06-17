import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getInboundWorkbenchOverrideKey } from "@/services/inbound-workbench/types";

describe("getInboundWorkbenchOverrideKey", () => {
  it("prefixes seller id for stable multi-account keys", () => {
    assert.equal(
      getInboundWorkbenchOverrideKey({
        coupangSellerAccountId: "seller-1",
        optionId: "123",
        templateId: "456",
      }),
      "seller-1|123",
    );
    assert.equal(
      getInboundWorkbenchOverrideKey({
        coupangSellerAccountId: "seller-2",
        optionId: null,
        templateId: "456",
      }),
      "seller-2|template:456",
    );
  });
});

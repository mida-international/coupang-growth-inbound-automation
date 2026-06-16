import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deleteShoplingInboundDeliverable } from "@/services/deliverables/delete-shopling-inbound-deliverable";

describe("deleteShoplingInboundDeliverable", () => {
  it("rejects empty id", async () => {
    const result = await deleteShoplingInboundDeliverable("   ");

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.match(result.error, /id는 필수입니다/);
    }
  });
});

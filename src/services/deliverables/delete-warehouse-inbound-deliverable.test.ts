import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deleteWarehouseInboundDeliverable } from "@/services/deliverables/delete-warehouse-inbound-deliverable";

describe("deleteWarehouseInboundDeliverable", () => {
  it("rejects empty id", async () => {
    const result = await deleteWarehouseInboundDeliverable("   ");

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.match(result.error, /id는 필수입니다/);
    }
  });
});

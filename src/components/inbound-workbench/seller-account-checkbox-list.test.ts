import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { areSellerSelectionsEqual } from "@/components/inbound-workbench/seller-account-checkbox-list";

describe("areSellerSelectionsEqual", () => {
  it("returns true for the same ids regardless of order", () => {
    assert.equal(
      areSellerSelectionsEqual(["b", "a"], ["a", "b"]),
      true,
    );
  });

  it("returns false when selections differ", () => {
    assert.equal(
      areSellerSelectionsEqual(["a"], ["a", "b"]),
      false,
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseSellerSearchParam,
  resolveSellerAccountIds,
} from "@/services/coupang-seller-accounts/get-default-seller-account-id";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

const ACCOUNTS: SellerAccountView[] = [
  {
    id: "seller-1",
    displayName: "First",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    createdBy: { id: "u1", email: "a@example.com", name: null },
  },
  {
    id: "seller-2",
    displayName: "Second",
    isActive: true,
    createdAt: new Date("2024-02-01"),
    createdBy: { id: "u1", email: "a@example.com", name: null },
  },
  {
    id: "seller-3",
    displayName: "Inactive",
    isActive: false,
    createdAt: new Date("2024-03-01"),
    createdBy: { id: "u1", email: "a@example.com", name: null },
  },
];

describe("parseSellerSearchParam", () => {
  it("returns empty for missing param", () => {
    assert.deepEqual(parseSellerSearchParam(undefined), []);
  });

  it("parses repeated seller params", () => {
    assert.deepEqual(parseSellerSearchParam(["seller-1", "seller-2"]), [
      "seller-1",
      "seller-2",
    ]);
  });
});

describe("resolveSellerAccountIds", () => {
  it("defaults to the first active account when param is missing", () => {
    assert.deepEqual(resolveSellerAccountIds(ACCOUNTS), ["seller-1"]);
  });

  it("keeps valid active ids and removes invalid ones", () => {
    assert.deepEqual(
      resolveSellerAccountIds(ACCOUNTS, ["seller-2", "invalid", "seller-3"]),
      ["seller-2"],
    );
  });

  it("preserves order for multiple valid sellers", () => {
    assert.deepEqual(
      resolveSellerAccountIds(ACCOUNTS, ["seller-2", "seller-1"]),
      ["seller-2", "seller-1"],
    );
  });
});

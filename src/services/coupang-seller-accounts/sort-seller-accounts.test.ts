import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getDefaultSellerAccountId } from "@/services/coupang-seller-accounts/get-default-seller-account-id";
import { sortSellerAccounts } from "@/services/coupang-seller-accounts/sort-seller-accounts";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

const BASE_ACCOUNT = {
  isActive: true,
  createdBy: { id: "u1", email: "a@example.com", name: null },
} satisfies Pick<SellerAccountView, "isActive" | "createdBy">;

describe("sortSellerAccounts", () => {
  it("places mizucos before other active accounts", () => {
    const accounts: SellerAccountView[] = [
      {
        ...BASE_ACCOUNT,
        id: "seller-b",
        displayName: "Beta Shop",
        createdAt: new Date("2024-01-01"),
      },
      {
        ...BASE_ACCOUNT,
        id: "seller-a",
        displayName: "mizucos",
        createdAt: new Date("2024-06-01"),
      },
    ];

    assert.deepEqual(
      sortSellerAccounts(accounts).map((account) => account.id),
      ["seller-a", "seller-b"],
    );
  });

  it("sorts remaining accounts by display name", () => {
    const accounts: SellerAccountView[] = [
      {
        ...BASE_ACCOUNT,
        id: "seller-c",
        displayName: "Charlie",
        createdAt: new Date("2024-01-01"),
      },
      {
        ...BASE_ACCOUNT,
        id: "seller-b",
        displayName: "Bravo",
        createdAt: new Date("2024-02-01"),
      },
    ];

    assert.deepEqual(
      sortSellerAccounts(accounts).map((account) => account.displayName),
      ["Bravo", "Charlie"],
    );
  });
});

describe("getDefaultSellerAccountId", () => {
  it("defaults to mizucos when present", () => {
    const accounts: SellerAccountView[] = [
      {
        ...BASE_ACCOUNT,
        id: "seller-old",
        displayName: "First",
        createdAt: new Date("2024-01-01"),
      },
      {
        ...BASE_ACCOUNT,
        id: "seller-mizucos",
        displayName: "mizucos",
        createdAt: new Date("2024-06-01"),
      },
    ];

    assert.equal(getDefaultSellerAccountId(accounts), "seller-mizucos");
  });
});

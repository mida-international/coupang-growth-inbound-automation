import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Prisma } from "@/generated/prisma/client";
import { resetOnHealthUpload } from "@/services/inbound-workbench/reset-growth-inbound-recommend-overrides";

const SELLER_ID = "seller-1";

type UpdateManyArgs = {
  where: {
    coupangSellerAccountId: string;
    growthInboundRecommendQty: { not: null };
  };
  data: { growthInboundRecommendQty: null };
};

type DeleteManyArgs = {
  where: {
    coupangSellerAccountId: string;
    safetyStock: null;
    growthInboundRecommendQty: null;
  };
};

type SellerUpdateArgs = {
  where: { id: string };
  data: { actualPackedQtyResetAt: Date };
};

function createMockTx(
  updateCount: number,
  deleteCount: number,
): {
  tx: Prisma.TransactionClient;
  updateCalls: UpdateManyArgs[];
  deleteCalls: DeleteManyArgs[];
  sellerUpdateCalls: SellerUpdateArgs[];
} {
  const updateCalls: UpdateManyArgs[] = [];
  const deleteCalls: DeleteManyArgs[] = [];
  const sellerUpdateCalls: SellerUpdateArgs[] = [];

  const tx = {
    inboundPlanningOverride: {
      updateMany: async (args: UpdateManyArgs) => {
        updateCalls.push(args);
        return { count: updateCount };
      },
      deleteMany: async (args: DeleteManyArgs) => {
        deleteCalls.push(args);
        return { count: deleteCount };
      },
    },
    coupangSellerAccount: {
      update: async (args: SellerUpdateArgs) => {
        sellerUpdateCalls.push(args);
        return { id: args.where.id };
      },
    },
  } as unknown as Prisma.TransactionClient;

  return { tx, updateCalls, deleteCalls, sellerUpdateCalls };
}

describe("resetOnHealthUpload", () => {
  it("clears growth overrides, deletes empty rows, and resets actual packed qty epoch", async () => {
    const { tx, updateCalls, deleteCalls, sellerUpdateCalls } = createMockTx(
      3,
      2,
    );

    const result = await resetOnHealthUpload(tx, SELLER_ID);

    assert.equal(result.clearedCount, 3);
    assert.equal(result.deletedEmptyCount, 2);
    assert.equal(result.actualPackedQtyReset, true);
    assert.equal(updateCalls.length, 1);
    assert.equal(deleteCalls.length, 1);
    assert.equal(sellerUpdateCalls.length, 1);
    assert.equal(updateCalls[0]?.where.coupangSellerAccountId, SELLER_ID);
    assert.equal(deleteCalls[0]?.where.coupangSellerAccountId, SELLER_ID);
    assert.equal(sellerUpdateCalls[0]?.where.id, SELLER_ID);
    assert.ok(sellerUpdateCalls[0]?.data.actualPackedQtyResetAt instanceof Date);
  });

  it("returns zero counts when no overrides exist", async () => {
    const { tx } = createMockTx(0, 0);

    const result = await resetOnHealthUpload(tx, SELLER_ID);

    assert.equal(result.clearedCount, 0);
    assert.equal(result.deletedEmptyCount, 0);
    assert.equal(result.actualPackedQtyReset, true);
  });
});

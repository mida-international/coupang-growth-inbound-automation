import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Prisma } from "@/generated/prisma/client";
import { resetGrowthInboundRecommendOverrides } from "@/services/inbound-workbench/reset-growth-inbound-recommend-overrides";

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

function createMockTx(
  updateCount: number,
  deleteCount: number,
): {
  tx: Prisma.TransactionClient;
  updateCalls: UpdateManyArgs[];
  deleteCalls: DeleteManyArgs[];
} {
  const updateCalls: UpdateManyArgs[] = [];
  const deleteCalls: DeleteManyArgs[] = [];

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
  } as unknown as Prisma.TransactionClient;

  return { tx, updateCalls, deleteCalls };
}

describe("resetGrowthInboundRecommendOverrides", () => {
  it("clears growth overrides and deletes empty rows for the seller", async () => {
    const { tx, updateCalls, deleteCalls } = createMockTx(3, 2);

    const result = await resetGrowthInboundRecommendOverrides(tx, SELLER_ID);

    assert.equal(result.clearedCount, 3);
    assert.equal(result.deletedEmptyCount, 2);
    assert.equal(updateCalls.length, 1);
    assert.equal(deleteCalls.length, 1);
    assert.equal(updateCalls[0]?.where.coupangSellerAccountId, SELLER_ID);
    assert.equal(deleteCalls[0]?.where.coupangSellerAccountId, SELLER_ID);
    assert.deepEqual(updateCalls[0]?.data, {
      growthInboundRecommendQty: null,
    });
    assert.equal(deleteCalls[0]?.where.safetyStock, null);
    assert.equal(deleteCalls[0]?.where.growthInboundRecommendQty, null);
  });

  it("returns zero counts when no overrides exist", async () => {
    const { tx } = createMockTx(0, 0);

    const result = await resetGrowthInboundRecommendOverrides(tx, SELLER_ID);

    assert.equal(result.clearedCount, 0);
    assert.equal(result.deletedEmptyCount, 0);
  });
});

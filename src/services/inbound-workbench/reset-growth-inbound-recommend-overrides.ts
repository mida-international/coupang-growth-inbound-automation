import type { Prisma } from "@/generated/prisma/client";

export type ResetGrowthInboundRecommendOverridesResult = {
  clearedCount: number;
  deletedEmptyCount: number;
};

export async function resetGrowthInboundRecommendOverrides(
  tx: Prisma.TransactionClient,
  coupangSellerAccountId: string,
): Promise<ResetGrowthInboundRecommendOverridesResult> {
  const cleared = await tx.inboundPlanningOverride.updateMany({
    where: {
      coupangSellerAccountId,
      growthInboundRecommendQty: { not: null },
    },
    data: {
      growthInboundRecommendQty: null,
    },
  });

  const deletedEmpty = await tx.inboundPlanningOverride.deleteMany({
    where: {
      coupangSellerAccountId,
      safetyStock: null,
      growthInboundRecommendQty: null,
    },
  });

  return {
    clearedCount: cleared.count,
    deletedEmptyCount: deletedEmpty.count,
  };
}

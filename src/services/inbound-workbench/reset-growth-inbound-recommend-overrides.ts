import type { Prisma } from "@/generated/prisma/client";

export type ResetOnHealthUploadResult = {
  clearedCount: number;
  deletedEmptyCount: number;
  actualPackedQtyReset: boolean;
};

/** @deprecated Use resetOnHealthUpload */
export type ResetGrowthInboundRecommendOverridesResult = ResetOnHealthUploadResult;

export async function resetOnHealthUpload(
  tx: Prisma.TransactionClient,
  coupangSellerAccountId: string,
): Promise<ResetOnHealthUploadResult> {
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

  await tx.coupangSellerAccount.update({
    where: { id: coupangSellerAccountId },
    data: { actualPackedQtyResetAt: new Date() },
  });

  return {
    clearedCount: cleared.count,
    deletedEmptyCount: deletedEmpty.count,
    actualPackedQtyReset: true,
  };
}

/** @deprecated Use resetOnHealthUpload */
export async function resetGrowthInboundRecommendOverrides(
  tx: Prisma.TransactionClient,
  coupangSellerAccountId: string,
): Promise<ResetOnHealthUploadResult> {
  return resetOnHealthUpload(tx, coupangSellerAccountId);
}

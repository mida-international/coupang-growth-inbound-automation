import { z } from "zod";

import { prisma } from "@/lib/db";

const nonNegativeInt = z.number().int().min(0);

export const upsertInboundPlanningOverrideItemSchema = z
  .object({
    optionId: z.string().optional(),
    templateId: z.string().optional(),
    safetyStock: nonNegativeInt.optional(),
    growthInboundRecommendQty: nonNegativeInt.optional(),
  })
  .refine((item) => item.optionId || item.templateId, {
    message: "optionId 또는 templateId가 필요합니다.",
  });

export const batchUpsertInboundPlanningOverridesSchema = z.object({
  coupangSellerAccountId: z.string().min(1),
  items: z.array(upsertInboundPlanningOverrideItemSchema).min(1),
});

export type UpsertInboundPlanningOverrideItem = z.infer<
  typeof upsertInboundPlanningOverrideItemSchema
>;

export type BatchUpsertInboundPlanningOverridesInput = z.infer<
  typeof batchUpsertInboundPlanningOverridesSchema
> & {
  updatedById: string;
};

type OverrideResult =
  | { ok: true }
  | { ok: false; error: string };

async function upsertOne(
  sellerId: string,
  updatedById: string,
  item: UpsertInboundPlanningOverrideItem,
): Promise<OverrideResult> {
  const updateData = {
    ...(item.safetyStock !== undefined ? { safetyStock: item.safetyStock } : {}),
    ...(item.growthInboundRecommendQty !== undefined
      ? { growthInboundRecommendQty: item.growthInboundRecommendQty }
      : {}),
    updatedById,
  };

  const createData = {
    safetyStock: item.safetyStock ?? null,
    growthInboundRecommendQty: item.growthInboundRecommendQty ?? null,
    updatedById,
  };

  if (item.optionId) {
    await prisma.inboundPlanningOverride.upsert({
      where: {
        coupangSellerAccountId_optionId: {
          coupangSellerAccountId: sellerId,
          optionId: BigInt(item.optionId),
        },
      },
      create: {
        coupangSellerAccountId: sellerId,
        optionId: BigInt(item.optionId),
        templateId: item.templateId ? BigInt(item.templateId) : null,
        ...createData,
      },
      update: updateData,
    });

    return { ok: true };
  }

  if (!item.templateId) {
    return { ok: false, error: "optionId 또는 templateId가 필요합니다." };
  }

  const templateId = BigInt(item.templateId);
  const existing = await prisma.inboundPlanningOverride.findFirst({
    where: {
      coupangSellerAccountId: sellerId,
      templateId,
      optionId: null,
    },
  });

  if (existing) {
    await prisma.inboundPlanningOverride.update({
      where: { id: existing.id },
      data: updateData,
    });
  } else {
    await prisma.inboundPlanningOverride.create({
      data: {
        coupangSellerAccountId: sellerId,
        templateId,
        optionId: null,
        ...createData,
      },
    });
  }

  return { ok: true };
}

export async function batchUpsertInboundPlanningOverrides(
  input: BatchUpsertInboundPlanningOverridesInput,
): Promise<OverrideResult> {
  const parsed = batchUpsertInboundPlanningOverridesSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "요청 본문이 올바르지 않습니다." };
  }

  const { coupangSellerAccountId, items } = parsed.data;

  const account = await prisma.coupangSellerAccount.findUnique({
    where: { id: coupangSellerAccountId },
    select: { id: true },
  });

  if (!account) {
    return { ok: false, error: "쿠팡 판매자 계정을 찾을 수 없습니다." };
  }

  for (const item of items) {
    const result = await upsertOne(
      coupangSellerAccountId,
      input.updatedById,
      item,
    );

    if (!result.ok) {
      return result;
    }
  }

  return { ok: true };
}

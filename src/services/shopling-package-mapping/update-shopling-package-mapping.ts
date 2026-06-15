import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  mapShoplingPackageMappingRow,
  shoplingPackageMappingRowSelect,
} from "@/services/shopling-package-mapping/map-package-mapping-row";
import type {
  ShoplingPackageMappingRowView,
  ShoplingPackageMappingServiceResult,
  UpdateShoplingPackageMappingBody,
} from "@/services/shopling-package-mapping/types";

const nullableString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

const updateSchema = z
  .object({
    packageBarcode: nullableString,
    packagePtnGoodsCd: nullableString,
    packageOptValue: nullableString,
    singleBarcode: nullableString,
    singleGoodsKey: nullableString,
    singleOptValue: nullableString,
    singlePtnGoodsCd: nullableString,
    mapCnt: z
      .number()
      .int("구성수량은 정수여야 합니다.")
      .min(1, "구성수량은 1 이상이어야 합니다.")
      .optional(),
  })
  .refine(
    (value) =>
      Object.keys(value).some(
        (key) => value[key as keyof typeof value] !== undefined,
      ),
    { message: "업데이트할 필드가 없습니다." },
  );

function normalizeNullable(value: string | null | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function updateShoplingPackageMapping(
  id: string,
  body: UpdateShoplingPackageMappingBody,
): Promise<ShoplingPackageMappingServiceResult<ShoplingPackageMappingRowView>> {
  if (!id.trim()) {
    return { ok: false, error: "id는 필수입니다." };
  }

  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { ok: false, error: firstIssue };
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = { manuallyEdited: true };

  if (data.packageBarcode !== undefined) {
    updateData.packageBarcode = normalizeNullable(data.packageBarcode);
  }

  if (data.packagePtnGoodsCd !== undefined) {
    updateData.packagePtnGoodsCd = normalizeNullable(data.packagePtnGoodsCd);
  }

  if (data.packageOptValue !== undefined) {
    updateData.packageOptValue = normalizeNullable(data.packageOptValue);
  }

  if (data.singleBarcode !== undefined) {
    updateData.singleBarcode = normalizeNullable(data.singleBarcode);
  }

  if (data.singleGoodsKey !== undefined) {
    updateData.singleGoodsKey = normalizeNullable(data.singleGoodsKey);
  }

  if (data.singleOptValue !== undefined) {
    updateData.singleOptValue = normalizeNullable(data.singleOptValue);
  }

  if (data.singlePtnGoodsCd !== undefined) {
    updateData.singlePtnGoodsCd = normalizeNullable(data.singlePtnGoodsCd);
  }

  if (data.mapCnt !== undefined) {
    updateData.mapCnt = data.mapCnt;
  }

  const existing = await prisma.shoplingPackageMapping.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return { ok: false, error: "패키지 매핑을 찾을 수 없습니다." };
  }

  try {
    const row = await prisma.shoplingPackageMapping.update({
      where: { id },
      data: updateData,
      select: shoplingPackageMappingRowSelect,
    });

    return { ok: true, data: mapShoplingPackageMappingRow(row) };
  } catch {
    return { ok: false, error: "패키지 매핑 수정에 실패했습니다." };
  }
}

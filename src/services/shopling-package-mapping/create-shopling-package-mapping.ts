import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  mapShoplingPackageMappingRow,
  shoplingPackageMappingRowSelect,
} from "@/services/shopling-package-mapping/map-package-mapping-row";
import type {
  CreateShoplingPackageMappingBody,
  ShoplingPackageMappingRowView,
  ShoplingPackageMappingServiceResult,
} from "@/services/shopling-package-mapping/types";

const nullableString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

const createSchema = z.object({
  packageOptId: z.string().trim().min(1, "패키지 옵션ID는 필수입니다."),
  singleOptId: z.string().trim().min(1, "단품 옵션ID는 필수입니다."),
  packageGoodsKey: z.string().trim().min(1, "패키지 샵플링코드는 필수입니다."),
  mapCnt: z
    .number()
    .int("구성수량은 정수여야 합니다.")
    .min(1, "구성수량은 1 이상이어야 합니다."),
  packageBarcode: nullableString,
  packagePtnGoodsCd: nullableString,
  packageOptValue: nullableString,
  singleBarcode: nullableString,
  singleGoodsKey: nullableString,
  singleOptValue: nullableString,
  singlePtnGoodsCd: nullableString,
});

function normalizeNullable(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function createShoplingPackageMapping(
  body: CreateShoplingPackageMappingBody,
): Promise<ShoplingPackageMappingServiceResult<ShoplingPackageMappingRowView>> {
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { ok: false, error: firstIssue };
  }

  const data = parsed.data;

  const existing = await prisma.shoplingPackageMapping.findUnique({
    where: {
      packageOptId_singleOptId: {
        packageOptId: data.packageOptId,
        singleOptId: data.singleOptId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      ok: false,
      error:
        "동일한 (패키지 옵션ID, 단품 옵션ID) 조합이 이미 존재합니다.",
    };
  }

  try {
    const row = await prisma.shoplingPackageMapping.create({
      data: {
        packageOptId: data.packageOptId,
        singleOptId: data.singleOptId,
        packageGoodsKey: data.packageGoodsKey,
        mapCnt: data.mapCnt,
        packageBarcode: normalizeNullable(data.packageBarcode),
        packagePtnGoodsCd: normalizeNullable(data.packagePtnGoodsCd),
        packageOptValue: normalizeNullable(data.packageOptValue),
        singleBarcode: normalizeNullable(data.singleBarcode),
        singleGoodsKey: normalizeNullable(data.singleGoodsKey),
        singleOptValue: normalizeNullable(data.singleOptValue),
        singlePtnGoodsCd: normalizeNullable(data.singlePtnGoodsCd),
        manuallyEdited: true,
      },
      select: shoplingPackageMappingRowSelect,
    });

    return { ok: true, data: mapShoplingPackageMappingRow(row) };
  } catch {
    return { ok: false, error: "패키지 매핑 추가에 실패했습니다." };
  }
}

import { prisma } from "@/lib/db";
import {
  mapShoplingPackageMappingRow,
  shoplingPackageMappingRowSelect,
} from "@/services/shopling-package-mapping/map-package-mapping-row";
import type { ListShoplingPackageMappingResult } from "@/services/shopling-package-mapping/types";
import { normalizeShoplingPackageMappingPageSize } from "@/services/shopling-package-mapping/types";

type ListShoplingPackageMappingOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
};

function buildWhere(search?: string) {
  const trimmed = search?.trim();

  if (!trimmed) {
    return {};
  }

  return {
    OR: [
      { packageBarcode: { contains: trimmed, mode: "insensitive" as const } },
      { packageGoodsKey: { contains: trimmed, mode: "insensitive" as const } },
      {
        packagePtnGoodsCd: { contains: trimmed, mode: "insensitive" as const },
      },
      { packageOptId: { contains: trimmed, mode: "insensitive" as const } },
      { packageOptValue: { contains: trimmed, mode: "insensitive" as const } },
      { singleBarcode: { contains: trimmed, mode: "insensitive" as const } },
      { singleGoodsKey: { contains: trimmed, mode: "insensitive" as const } },
      {
        singlePtnGoodsCd: { contains: trimmed, mode: "insensitive" as const },
      },
      { singleOptId: { contains: trimmed, mode: "insensitive" as const } },
      { singleOptValue: { contains: trimmed, mode: "insensitive" as const } },
    ],
  };
}

export async function listShoplingPackageMapping(
  options: ListShoplingPackageMappingOptions = {},
): Promise<ListShoplingPackageMappingResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = normalizeShoplingPackageMappingPageSize(options.pageSize);
  const where = buildWhere(options.search);

  const [totalCount, rows] = await Promise.all([
    prisma.shoplingPackageMapping.count({ where }),
    prisma.shoplingPackageMapping.findMany({
      where,
      select: shoplingPackageMappingRowSelect,
      orderBy: [{ packageOptId: "asc" }, { singleOptId: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    totalCount,
    rows: rows.map(mapShoplingPackageMappingRow),
  };
}

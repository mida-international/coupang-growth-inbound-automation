import { prisma } from "@/lib/db";
import { formatYyyyMmDd } from "@/lib/shopling/format-yyyymmdd";
import type { ListShoplingInventoryResult } from "@/services/shopling-data/types";
import { normalizeShoplingInventoryPageSize } from "@/services/shopling-data/types";

type ListShoplingInventoryOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
};

function buildWhere(maxSnapshotDate: Date, search?: string) {
  const trimmed = search?.trim();

  return {
    snapshotDate: maxSnapshotDate,
    ...(trimmed
      ? {
          OR: [
            { goodsKey: { contains: trimmed, mode: "insensitive" as const } },
            { ptnGoodsCd: { contains: trimmed, mode: "insensitive" as const } },
            { barcode: { contains: trimmed, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function listShoplingInventory(
  options: ListShoplingInventoryOptions = {},
): Promise<ListShoplingInventoryResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = normalizeShoplingInventoryPageSize(options.pageSize);

  const { _max } = await prisma.shoplingInventory.aggregate({
    _max: { snapshotDate: true },
  });

  const maxSnapshotDate = _max.snapshotDate;

  if (!maxSnapshotDate) {
    return {
      snapshotDate: null,
      totalCount: 0,
      rows: [],
    };
  }

  const where = buildWhere(maxSnapshotDate, options.search);

  const [totalCount, rows] = await Promise.all([
    prisma.shoplingInventory.count({ where }),
    prisma.shoplingInventory.findMany({
      where,
      select: {
        goodsKey: true,
        ptnGoodsCd: true,
        saleStatus: true,
        goodsTp: true,
        barcode: true,
        optionTitle: true,
        optionValue: true,
        availableStock: true,
        optStatus: true,
        location: true,
      },
      orderBy: [{ goodsKey: "asc" }, { barcode: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    snapshotDate: formatYyyyMmDd(maxSnapshotDate),
    totalCount,
    rows: rows.map((row) => ({
      goodsKey: row.goodsKey,
      ptnGoodsCd: row.ptnGoodsCd,
      saleStatus: row.saleStatus,
      goodsTp: row.goodsTp,
      barcode: row.barcode,
      optionTitle: row.optionTitle,
      optionValue: row.optionValue,
      availableStock: row.availableStock ?? 0,
      optStatus: row.optStatus,
      location: row.location,
    })),
  };
}

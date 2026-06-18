import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  buildNewOptionProductsBaseCte,
  buildNewOptionProductsSearchCondition,
} from "@/services/shopling-data/list-new-option-products-query";
import { resolveNewOptionProductsDateRange } from "@/services/shopling-data/resolve-new-option-products-date-range";
import type {
  ListNewOptionProductsResult,
  ShoplingNewOptionProductRowView,
} from "@/services/shopling-data/types";
import { normalizeShoplingInventoryPageSize } from "@/services/shopling-data/types";

type ListNewOptionProductsOptions = {
  from?: string;
  to?: string;
  days?: string | number;
  page?: number;
  pageSize?: number;
  search?: string;
  exportAll?: boolean;
};

type RawNewOptionProductRow = {
  goods_key: string;
  opt_id: string;
  ptn_goods_cd: string | null;
  option_value: string | null;
  barcode: string;
  first_added_date: Date;
};

function formatFirstAddedDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mapRow(row: RawNewOptionProductRow): ShoplingNewOptionProductRowView {
  return {
    goodsKey: row.goods_key,
    optId: row.opt_id,
    ptnGoodsCd: row.ptn_goods_cd,
    optionValue: row.option_value,
    barcode: row.barcode,
    firstAddedDate: formatFirstAddedDate(row.first_added_date),
  };
}

export async function listNewOptionProducts(
  options: ListNewOptionProductsOptions = {},
): Promise<ListNewOptionProductsResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = normalizeShoplingInventoryPageSize(options.pageSize);
  const exportAll = options.exportAll === true;
  const dateRange = resolveNewOptionProductsDateRange({
    from: options.from,
    to: options.to,
    days: options.days,
  });
  const searchCondition = buildNewOptionProductsSearchCondition(options.search);

  const inventoryCount = await prisma.shoplingInventory.count();

  if (inventoryCount === 0) {
    return {
      hasInventoryHistory: false,
      from: dateRange.from,
      to: dateRange.to,
      days: dateRange.days,
      totalCount: 0,
      rows: [],
    };
  }

  const baseCte = buildNewOptionProductsBaseCte(
    dateRange.from,
    dateRange.to,
    searchCondition,
  );

  const paginationClause = exportAll
    ? Prisma.empty
    : Prisma.sql`LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

  const [countResult, rows] = await Promise.all([
    prisma.$queryRaw<[{ count: number }]>(
      Prisma.sql`
        ${baseCte}
        SELECT COUNT(*)::int AS count
        FROM visible_rows
      `,
    ),
    prisma.$queryRaw<RawNewOptionProductRow[]>(
      Prisma.sql`
        ${baseCte}
        SELECT
          goods_key,
          opt_id,
          ptn_goods_cd,
          option_value,
          barcode,
          first_added_date
        FROM visible_rows
        ORDER BY first_added_date DESC, goods_key ASC, barcode ASC
        ${paginationClause}
      `,
    ),
  ]);

  return {
    hasInventoryHistory: true,
    from: dateRange.from,
    to: dateRange.to,
    days: dateRange.days,
    totalCount: countResult[0]?.count ?? 0,
    rows: rows.map(mapRow),
  };
}

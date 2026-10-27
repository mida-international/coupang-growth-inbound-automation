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
import { withWorkbenchResultCache } from "@/services/inbound-workbench/workbench-result-cache";

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
  total_count: bigint;
};

/**
 * 자료 버전 — 샵플링 재고·입고 템플릿 적재는 모두 ingestion_log 에 한 줄씩 남으므로
 * 그 표의 MAX(id) 하나면 「자료가 바뀌었나」를 알 수 있다 (2026-10-27 느림 수리, 작업대와 같은 방식).
 */
async function getIngestionVersion(): Promise<string> {
  const rows = await prisma.$queryRaw<[{ max_id: bigint | null }]>(
    Prisma.sql`SELECT MAX(id) AS max_id FROM ingestion_log`,
  );
  return rows[0]?.max_id?.toString() ?? "-";
}

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

  // 전체 건수 세기(큰 표 전체 훑기) 대신 한 줄 있는지만 본다.
  const anyInventory = await prisma.shoplingInventory.findFirst({
    select: { id: true },
  });

  if (!anyInventory) {
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

  // 2026-10-27 느림 수리: 건수 쿼리와 목록 쿼리가 각각 shopling_inventory 전체를 두 번 훑던 것을
  // 한 쿼리(COUNT(*) OVER())로 합치고, 자료 버전이 같으면 지난 결과를 그대로 쓴다.
  const version = await getIngestionVersion();
  const cacheKey = JSON.stringify({
    kind: "new-option-products",
    from: dateRange.from,
    to: dateRange.to,
    page,
    pageSize,
    exportAll,
    search: options.search?.trim() ?? "",
  });

  const { value } = await withWorkbenchResultCache(cacheKey, version, async () => {
    const rows = await prisma.$queryRaw<RawNewOptionProductRow[]>(
      Prisma.sql`
        ${baseCte}
        SELECT
          goods_key,
          opt_id,
          ptn_goods_cd,
          option_value,
          barcode,
          first_added_date,
          COUNT(*) OVER()::bigint AS total_count
        FROM visible_rows
        ORDER BY first_added_date DESC, goods_key ASC, barcode ASC
        ${paginationClause}
      `,
    );

    return {
      totalCount: Number(rows[0]?.total_count ?? 0),
      rows: rows.map(mapRow),
    };
  });

  return {
    hasInventoryHistory: true,
    from: dateRange.from,
    to: dateRange.to,
    days: dateRange.days,
    totalCount: value.totalCount,
    rows: value.rows,
  };
}

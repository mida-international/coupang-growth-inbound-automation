import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  buildSellerInClause,
  buildWorkbenchCoreQueryPrefix,
} from "@/services/inbound-workbench/inbound-workbench-query-sql";
import { resolveWorkbenchQueryContext } from "@/services/inbound-workbench/resolve-workbench-query-context";
import {
  INVENTORY_HEALTH_ALL_SELLERS,
  isInventoryHealthAllSellers,
  type InventoryHealthSellerFilter,
} from "@/services/coupang-growth-data/resolve-inventory-health-seller-filter";
import type {
  InventoryHealthRowView,
  ListInventoryHealthResult,
} from "@/services/coupang-growth-data/types";
import { normalizeInventoryHealthPageSize } from "@/services/coupang-growth-data/types";

type ListInventoryHealthOptions = {
  sellerFilter: InventoryHealthSellerFilter;
  page?: number;
  pageSize?: number;
  search?: string;
  exportAll?: boolean;
};

type RawInventoryHealthRow = {
  seller_display_name: string;
  option_id: bigint | null;
  registered_product_name: string | null;
  option_name: string | null;
  product_barcode: string | null;
  ptn_goods_cd: string | null;
  orderable_quantity: number;
  pending_inbounds: number;
  recent_sales_qty_7days: number;
  recent_sales_qty_30days: number;
  recommended_inbound_qty: number;
  offer_condition: string | null;
  days_of_cover: string | null;
  health_snapshot_date: Date;
  total_count: bigint;
};

function formatSnapshotDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function mapRow(row: RawInventoryHealthRow): InventoryHealthRowView {
  return {
    sellerDisplayName: row.seller_display_name,
    optionId: row.option_id?.toString() ?? null,
    registeredProductName: row.registered_product_name,
    optionName: row.option_name,
    productBarcode: row.product_barcode,
    ptnGoodsCd: row.ptn_goods_cd,
    orderableQuantity: row.orderable_quantity,
    pendingInbounds: row.pending_inbounds,
    recentSalesQty7days: row.recent_sales_qty_7days,
    recentSalesQty30days: row.recent_sales_qty_30days,
    recommendedInboundQty: row.recommended_inbound_qty,
    offerCondition: row.offer_condition,
    daysOfCover: row.days_of_cover,
    healthSnapshotDate: formatSnapshotDate(row.health_snapshot_date),
  };
}

function buildSearchCondition(search?: string) {
  const trimmed = search?.trim();

  if (!trimmed) {
    return Prisma.empty;
  }

  const pattern = `%${trimmed}%`;

  return Prisma.sql`AND (
    v.registered_product_name ILIKE ${pattern}
    OR v.option_name ILIKE ${pattern}
    OR v.product_barcode ILIKE ${pattern}
    OR v.ptn_goods_cd ILIKE ${pattern}
    OR a."displayName" ILIKE ${pattern}
  )`;
}

async function resolveSellerIdsForQuery(
  sellerFilter: InventoryHealthSellerFilter,
): Promise<string[]> {
  if (!isInventoryHealthAllSellers(sellerFilter)) {
    return [sellerFilter];
  }

  const accounts = await prisma.coupangSellerAccount.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  return accounts.map((account) => account.id);
}

function buildOrderBy(sellerFilter: InventoryHealthSellerFilter) {
  if (isInventoryHealthAllSellers(sellerFilter)) {
    return Prisma.sql`
      ORDER BY a."displayName" ASC,
               v.registered_product_name ASC NULLS LAST,
               v.option_id ASC NULLS LAST
    `;
  }

  return Prisma.sql`
    ORDER BY v.registered_product_name ASC NULLS LAST, v.option_id ASC NULLS LAST
  `;
}

export async function listInventoryHealth(
  options: ListInventoryHealthOptions,
): Promise<ListInventoryHealthResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = normalizeInventoryHealthPageSize(options.pageSize);
  const exportAll = options.exportAll === true;
  const sellerFilter = options.sellerFilter;
  const isAllSellers = isInventoryHealthAllSellers(sellerFilter);
  const sellerIds = await resolveSellerIdsForQuery(sellerFilter);

  if (sellerIds.length === 0) {
    return {
      snapshotDate: null,
      isAllSellers,
      hasHealthData: false,
      totalCount: 0,
      rows: [],
    };
  }

  const searchCondition = buildSearchCondition(options.search);
  const orderBy = buildOrderBy(sellerFilter);
  const queryContext = await resolveWorkbenchQueryContext(sellerIds);

  if (!queryContext) {
    return {
      snapshotDate: null,
      isAllSellers,
      hasHealthData: false,
      totalCount: 0,
      rows: [],
    };
  }

  const healthSnapshot = await prisma.coupangGrowthInventoryHealth.aggregate({
    where: isAllSellers
      ? { coupangSellerAccount: { isActive: true } }
      : { coupangSellerAccountId: sellerFilter },
    _max: { snapshotDate: true },
  });

  if (!healthSnapshot._max.snapshotDate) {
    return {
      snapshotDate: null,
      isAllSellers,
      hasHealthData: false,
      totalCount: 0,
      rows: [],
    };
  }

  const snapshotDate = isAllSellers
    ? null
    : formatSnapshotDate(healthSnapshot._max.snapshotDate);

  const queryPrefix = buildWorkbenchCoreQueryPrefix(queryContext);
  const sellerIn = buildSellerInClause(sellerIds);
  const paginationClause = exportAll
    ? Prisma.empty
    : Prisma.sql`LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

  const rows = await prisma.$queryRaw<RawInventoryHealthRow[]>(
    Prisma.sql`
      ${queryPrefix},
      filtered AS (
        SELECT
          a."displayName" AS seller_display_name,
          v.option_id,
          v.registered_product_name,
          v.option_name,
          v.product_barcode,
          v.ptn_goods_cd,
          v.orderable_quantity,
          v.pending_inbounds,
          v.recent_sales_qty_7days,
          v.recent_sales_qty_30days,
          v.recommended_inbound_qty,
          v.offer_condition,
          v.days_of_cover,
          v.health_snapshot_date
        FROM workbench_core v
        INNER JOIN "CoupangSellerAccount" a
          ON v.coupang_seller_account_id = a.id
        WHERE v.coupang_seller_account_id IN (${sellerIn})
        ${searchCondition}
        ${orderBy}
        ${paginationClause}
      ),
      total_count AS (
        SELECT COUNT(*)::bigint AS count
        FROM workbench_core v
        INNER JOIN "CoupangSellerAccount" a
          ON v.coupang_seller_account_id = a.id
        WHERE v.coupang_seller_account_id IN (${sellerIn})
        ${searchCondition}
      )
      SELECT
        filtered.*,
        total_count.count AS total_count
      FROM filtered
      CROSS JOIN total_count
    `,
  );

  return {
    snapshotDate,
    isAllSellers,
    hasHealthData: true,
    totalCount: Number(rows[0]?.total_count ?? 0),
    rows: rows.map(mapRow),
  };
}

export { INVENTORY_HEALTH_ALL_SELLERS };

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type {
  InboundWorkbenchRowView,
  InboundWorkbenchSnapshotDates,
  ListInboundWorkbenchResult,
} from "@/services/inbound-workbench/types";
import { normalizeInboundWorkbenchPageSize } from "@/services/inbound-workbench/types";

type ListInboundWorkbenchOptions = {
  coupangSellerAccountId: string;
  page?: number;
  pageSize?: number;
  search?: string;
};

type RawWorkbenchRow = {
  template_id: bigint;
  option_id: bigint | null;
  registered_product_name: string | null;
  option_name: string | null;
  product_barcode: string | null;
  shopling_row_key: string;
  shopling_available_stock: number;
  ptn_goods_cd: string | null;
  location: string | null;
  orderable_quantity: number;
  sales_qty_60days: number;
  recent_sales_qty_7days: number;
  recent_sales_qty_30days: number;
  recommended_inbound_qty: number;
  pending_inbounds: number;
  offer_condition: string | null;
  days_of_cover: string | null;
  safety_stock: number;
  calculated_growth_inbound_recommend: number;
  growth_inbound_recommend: number;
  rotation_1_qty: number | null;
  rotation_2_qty: number | null;
  rotation_3_qty: number | null;
  rotation_1_date: Date | null;
  rotation_2_date: Date | null;
  rotation_3_date: Date | null;
  template_snapshot_date: Date;
  health_snapshot_date: Date | null;
  shopling_snapshot_date: Date | null;
};

function formatSnapshotDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatRotationDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }

  return formatSnapshotDate(value);
}

function mapRow(row: RawWorkbenchRow): InboundWorkbenchRowView {
  return {
    templateId: row.template_id.toString(),
    shoplingRowKey: row.shopling_row_key,
    optionId: row.option_id?.toString() ?? null,
    registeredProductName: row.registered_product_name,
    optionName: row.option_name,
    productBarcode: row.product_barcode,
    shoplingAvailableStock: row.shopling_available_stock,
    ptnGoodsCd: row.ptn_goods_cd,
    orderableQuantity: row.orderable_quantity,
    salesQty60days: row.sales_qty_60days,
    recentSalesQty7days: row.recent_sales_qty_7days,
    recentSalesQty30days: row.recent_sales_qty_30days,
    recommendedInboundQty: row.recommended_inbound_qty,
    pendingInbounds: row.pending_inbounds,
    offerCondition: row.offer_condition,
    daysOfCover: row.days_of_cover,
    location: row.location,
    safetyStock: row.safety_stock,
    calculatedGrowthInboundRecommend: row.calculated_growth_inbound_recommend,
    growthInboundRecommend: row.growth_inbound_recommend,
    rotation1Qty: row.rotation_1_qty,
    rotation2Qty: row.rotation_2_qty,
    rotation3Qty: row.rotation_3_qty,
    rotation1Date: formatRotationDate(row.rotation_1_date),
    rotation2Date: formatRotationDate(row.rotation_2_date),
    rotation3Date: formatRotationDate(row.rotation_3_date),
  };
}

async function fetchSnapshotDates(
  coupangSellerAccountId: string,
): Promise<InboundWorkbenchSnapshotDates | null> {
  const [template, health, shopling] = await Promise.all([
    prisma.coupangGrowthInboundTemplate.aggregate({
      where: { coupangSellerAccountId },
      _max: { snapshotDate: true },
    }),
    prisma.coupangGrowthInventoryHealth.aggregate({
      where: { coupangSellerAccountId },
      _max: { snapshotDate: true },
    }),
    prisma.shoplingInventory.aggregate({
      _max: { snapshotDate: true },
    }),
  ]);

  if (!template._max.snapshotDate) {
    return null;
  }

  return {
    template: formatSnapshotDate(template._max.snapshotDate),
    health: health._max.snapshotDate
      ? formatSnapshotDate(health._max.snapshotDate)
      : null,
    shopling: shopling._max.snapshotDate
      ? formatSnapshotDate(shopling._max.snapshotDate)
      : null,
  };
}

function buildSearchCondition(search?: string) {
  const trimmed = search?.trim();

  if (!trimmed) {
    return Prisma.empty;
  }

  const pattern = `%${trimmed}%`;

  return Prisma.sql`AND (
    registered_product_name ILIKE ${pattern}
    OR option_name ILIKE ${pattern}
    OR product_barcode ILIKE ${pattern}
    OR ptn_goods_cd ILIKE ${pattern}
  )`;
}

export async function listInboundWorkbench(
  options: ListInboundWorkbenchOptions,
): Promise<ListInboundWorkbenchResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = normalizeInboundWorkbenchPageSize(options.pageSize);
  const sellerId = options.coupangSellerAccountId;
  const searchCondition = buildSearchCondition(options.search);

  const snapshotDates = await fetchSnapshotDates(sellerId);

  if (!snapshotDates) {
    return {
      snapshotDates: null,
      totalCount: 0,
      rows: [],
    };
  }

  const baseWhere = Prisma.sql`
    WHERE coupang_seller_account_id = ${sellerId}
    ${searchCondition}
  `;

  const [countResult, rows] = await Promise.all([
    prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM inbound_workbench_display_v
        ${baseWhere}
      `,
    ),
    prisma.$queryRaw<RawWorkbenchRow[]>(
      Prisma.sql`
        SELECT
          template_id,
          option_id,
          registered_product_name,
          option_name,
          product_barcode,
          shopling_row_key,
          shopling_available_stock,
          ptn_goods_cd,
          location,
          orderable_quantity,
          sales_qty_60days,
          recent_sales_qty_7days,
          recent_sales_qty_30days,
          recommended_inbound_qty,
          pending_inbounds,
          offer_condition,
          days_of_cover,
          safety_stock,
          calculated_growth_inbound_recommend,
          growth_inbound_recommend,
          rotation_1_qty,
          rotation_1_date,
          rotation_2_qty,
          rotation_2_date,
          rotation_3_qty,
          rotation_3_date,
          template_snapshot_date,
          health_snapshot_date,
          shopling_snapshot_date
        FROM inbound_workbench_display_v
        ${baseWhere}
        ORDER BY registered_product_name ASC NULLS LAST, option_id ASC NULLS LAST, shopling_row_key ASC
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      `,
    ),
  ]);

  return {
    snapshotDates,
    totalCount: Number(countResult[0]?.count ?? 0),
    rows: rows.map(mapRow),
  };
}

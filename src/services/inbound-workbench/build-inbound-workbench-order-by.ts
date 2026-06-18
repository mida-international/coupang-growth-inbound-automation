import { Prisma } from "@/generated/prisma/client";
import type {
  InboundWorkbenchSortColumn,
  InboundWorkbenchSortDirection,
} from "@/services/inbound-workbench/inbound-workbench-sort";

const SORT_COLUMN_SQL: Record<InboundWorkbenchSortColumn, string> = {
  registeredProductName: "d.registered_product_name",
  optionName: "d.option_name",
  productBarcode: "d.product_barcode",
  shoplingAvailableStock: "d.shopling_available_stock",
  ptnGoodsCd: "d.ptn_goods_cd",
  orderableQuantity: "d.orderable_quantity",
  salesQty60days: "d.sales_qty_60days",
  recentSalesQty7days: "d.recent_sales_qty_7days",
  recentSalesQty30days: "d.recent_sales_qty_30days",
  recommendedInboundQty: "d.recommended_inbound_qty",
  pendingInbounds: "d.pending_inbounds",
  safetyStock: "d.safety_stock",
  growthInboundRecommend: "d.growth_inbound_recommend",
  remainingAfterInbound: "d.remaining_after_inbound",
  actualPackedQty: "d.actual_packed_qty",
  rotation1Qty: "d.rotation_1_qty",
  rotation2Qty: "d.rotation_2_qty",
  rotation3Qty: "d.rotation_3_qty",
  offerCondition: "d.offer_condition",
  daysOfCover: "d.days_of_cover",
  location: "d.location",
};

const DEFAULT_ORDER_BY = Prisma.sql`
  d.registered_product_name ASC NULLS LAST,
  d.option_id ASC NULLS LAST,
  d.shopling_row_key ASC
`;

export function buildInboundWorkbenchOrderBy(
  sort: InboundWorkbenchSortColumn | null,
  dir: InboundWorkbenchSortDirection | null,
): Prisma.Sql {
  if (!sort || !dir) {
    return DEFAULT_ORDER_BY;
  }

  const columnSql = SORT_COLUMN_SQL[sort];
  const directionSql = dir === "desc" ? "DESC" : "ASC";

  return Prisma.sql`
    ${Prisma.raw(`${columnSql} ${directionSql} NULLS LAST`)},
    d.registered_product_name ASC NULLS LAST,
    d.option_id ASC NULLS LAST,
    d.shopling_row_key ASC
  `;
}

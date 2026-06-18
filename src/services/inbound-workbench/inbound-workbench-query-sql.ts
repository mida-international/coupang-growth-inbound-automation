import { Prisma } from "@/generated/prisma/client";

export type WorkbenchQueryContext = {
  sellerIds: string[];
  shoplingSnapshotDate: Date | null;
};

export function buildSellerInClause(sellerIds: string[]): Prisma.Sql {
  return Prisma.join(sellerIds.map((id) => Prisma.sql`${id}`));
}

function buildShoplingLatestCte(shoplingSnapshotDate: Date | null): Prisma.Sql {
  if (!shoplingSnapshotDate) {
    return Prisma.sql`
      shopling_latest AS (
        SELECT s.*
        FROM shopling_inventory s
        WHERE FALSE
      )
    `;
  }

  return Prisma.sql`
    shopling_latest AS (
      SELECT s.*
      FROM shopling_inventory s
      INNER JOIN template_barcodes tb
        ON s.barcode = tb.barcode
      WHERE s.snapshot_date = ${shoplingSnapshotDate}::date
    )
  `;
}

export function buildWorkbenchCoreCtes(
  sellerIn: Prisma.Sql,
  shoplingSnapshotDate: Date | null,
): Prisma.Sql {
  return Prisma.sql`
    template_snapshot AS (
      SELECT
        coupang_seller_account_id,
        MAX(snapshot_date) AS max_date
      FROM coupang_growth_inbound_template
      WHERE coupang_seller_account_id IN (${sellerIn})
      GROUP BY coupang_seller_account_id
    ),
    template_latest AS (
      SELECT t.*
      FROM coupang_growth_inbound_template t
      INNER JOIN template_snapshot ts
        ON t.coupang_seller_account_id = ts.coupang_seller_account_id
        AND t.snapshot_date = ts.max_date
    ),
    health_snapshot AS (
      SELECT
        coupang_seller_account_id,
        MAX(snapshot_date) AS max_date
      FROM coupang_growth_inventory_health
      WHERE coupang_seller_account_id IN (${sellerIn})
      GROUP BY coupang_seller_account_id
    ),
    health_latest AS (
      SELECT h.*
      FROM coupang_growth_inventory_health h
      INNER JOIN health_snapshot hs
        ON h.coupang_seller_account_id = hs.coupang_seller_account_id
        AND h.snapshot_date = hs.max_date
    ),
    template_barcodes AS (
      SELECT DISTINCT TRIM(t.product_barcode) AS barcode
      FROM template_latest t
      WHERE t.product_barcode IS NOT NULL
        AND TRIM(t.product_barcode) <> ''
    ),
    ${buildShoplingLatestCte(shoplingSnapshotDate)},
    workbench_core AS MATERIALIZED (
      SELECT
        t.id AS template_id,
        t.coupang_seller_account_id,
        t.option_id,
        t.registered_product_id,
        t.registered_product_name,
        t.option_name,
        t.product_barcode,
        t.snapshot_date AS template_snapshot_date,
        h.snapshot_date AS health_snapshot_date,
        ${shoplingSnapshotDate ? Prisma.sql`${shoplingSnapshotDate}::date` : Prisma.sql`NULL::date`}
          AS shopling_snapshot_date,
        COALESCE(s.id::text, 'none') AS shopling_row_key,
        COALESCE(s.available_stock, 0) AS shopling_available_stock,
        s.ptn_goods_cd,
        s.option_value AS shopling_option_value,
        s.location,
        COALESCE(h.orderable_quantity, 0) AS orderable_quantity,
        COALESCE(h.recent_sales_qty_30days * 2, 0) AS sales_qty_60days,
        COALESCE(h.recent_sales_qty_7days, 0) AS recent_sales_qty_7days,
        COALESCE(h.recent_sales_qty_30days, 0) AS recent_sales_qty_30days,
        COALESCE(h.recommended_inbound_qty, 0) AS recommended_inbound_qty,
        COALESCE(h.pending_inbounds, 0) AS pending_inbounds,
        h.offer_condition,
        h.days_of_cover,
        LEAST(
          GREATEST(
            0,
            GREATEST(
              COALESCE(h.recent_sales_qty_30days, 0),
              COALESCE(h.recent_sales_qty_7days, 0) * 3
            ) - COALESCE(h.pending_inbounds, 0) - COALESCE(h.orderable_quantity, 0)
          ),
          COALESCE(s.available_stock, 0)
        ) AS calculated_growth_inbound_recommend
      FROM template_latest t
      INNER JOIN health_latest h
        ON t.coupang_seller_account_id = h.coupang_seller_account_id
        AND t.option_id IS NOT NULL
        AND h.option_id IS NOT NULL
        AND t.option_id = h.option_id
      LEFT JOIN shopling_latest s
        ON t.product_barcode IS NOT NULL
        AND TRIM(t.product_barcode) <> ''
        AND t.product_barcode = s.barcode
    )
  `;
}

export function buildWorkbenchDisplayCtes(sellerIn: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`
    relevant_barcodes AS MATERIALIZED (
      SELECT DISTINCT
        v.coupang_seller_account_id,
        TRIM(v.product_barcode) AS product_barcode
      FROM workbench_core v
      WHERE v.product_barcode IS NOT NULL
        AND TRIM(v.product_barcode) <> ''
    ),
    rotation_daily AS (
      SELECT
        r.coupang_seller_account_id,
        TRIM(r.product_barcode) AS product_barcode,
        ((r.recorded_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul')::date AS inbound_kst_date,
        SUM(r.quantity)::integer AS daily_qty
      FROM coupang_inbound_record r
      INNER JOIN relevant_barcodes rb
        ON r.coupang_seller_account_id = rb.coupang_seller_account_id
        AND TRIM(r.product_barcode) = rb.product_barcode
      WHERE r.coupang_seller_account_id IN (${sellerIn})
        AND r.quantity > 0
      GROUP BY 1, 2, 3
    ),
    rotation_ranked AS (
      SELECT
        coupang_seller_account_id,
        product_barcode,
        inbound_kst_date,
        daily_qty,
        ROW_NUMBER() OVER (
          PARTITION BY coupang_seller_account_id, product_barcode
          ORDER BY inbound_kst_date DESC
        ) AS rotation_rank
      FROM rotation_daily
    ),
    rotation AS MATERIALIZED (
      SELECT
        coupang_seller_account_id,
        product_barcode,
        MAX(daily_qty) FILTER (WHERE rotation_rank = 1) AS rotation_1_qty,
        MAX(inbound_kst_date) FILTER (WHERE rotation_rank = 1) AS rotation_1_date,
        MAX(daily_qty) FILTER (WHERE rotation_rank = 2) AS rotation_2_qty,
        MAX(inbound_kst_date) FILTER (WHERE rotation_rank = 2) AS rotation_2_date,
        MAX(daily_qty) FILTER (WHERE rotation_rank = 3) AS rotation_3_qty,
        MAX(inbound_kst_date) FILTER (WHERE rotation_rank = 3) AS rotation_3_date
      FROM rotation_ranked
      WHERE rotation_rank <= 3
      GROUP BY coupang_seller_account_id, product_barcode
    ),
    actual_packed AS MATERIALIZED (
      SELECT
        r.coupang_seller_account_id,
        TRIM(r.product_barcode) AS product_barcode,
        COALESCE(SUM(r.quantity), 0)::integer AS actual_packed_qty
      FROM coupang_inbound_record r
      INNER JOIN relevant_barcodes rb
        ON r.coupang_seller_account_id = rb.coupang_seller_account_id
        AND TRIM(r.product_barcode) = rb.product_barcode
      INNER JOIN "CoupangSellerAccount" a
        ON a.id = r.coupang_seller_account_id
      WHERE r.coupang_seller_account_id IN (${sellerIn})
        AND r.quantity > 0
        AND r.recorded_at >= COALESCE(
          a.actual_packed_qty_reset_at,
          TIMESTAMPTZ '1970-01-01 00:00:00+00'
        )
      GROUP BY r.coupang_seller_account_id, TRIM(r.product_barcode)
    ),
    workbench_display AS MATERIALIZED (
      SELECT
        v.*,
        COALESCE(o.safety_stock, 0) AS safety_stock,
        (o.safety_stock IS NOT NULL) AS has_safety_stock_override,
        COALESCE(o.growth_inbound_recommend_qty, v.calculated_growth_inbound_recommend)
          AS growth_inbound_recommend,
        GREATEST(
          0,
          v.shopling_available_stock
            - COALESCE(o.growth_inbound_recommend_qty, v.calculated_growth_inbound_recommend)
        ) AS remaining_after_inbound,
        COALESCE(ap.actual_packed_qty, 0) AS actual_packed_qty,
        rot.rotation_1_qty,
        rot.rotation_1_date,
        rot.rotation_2_qty,
        rot.rotation_2_date,
        rot.rotation_3_qty,
        rot.rotation_3_date
      FROM workbench_core v
      LEFT JOIN inbound_planning_override o
        ON v.coupang_seller_account_id = o.coupang_seller_account_id
        AND v.option_id IS NOT NULL
        AND v.option_id = o.option_id
      LEFT JOIN rotation rot
        ON v.coupang_seller_account_id = rot.coupang_seller_account_id
        AND v.product_barcode IS NOT NULL
        AND TRIM(v.product_barcode) <> ''
        AND TRIM(v.product_barcode) = rot.product_barcode
      LEFT JOIN actual_packed ap
        ON v.coupang_seller_account_id = ap.coupang_seller_account_id
        AND v.product_barcode IS NOT NULL
        AND TRIM(v.product_barcode) <> ''
        AND TRIM(v.product_barcode) = ap.product_barcode
    )
  `;
}

export function buildWorkbenchCoreQueryPrefix(
  context: WorkbenchQueryContext,
): Prisma.Sql {
  const sellerIn = buildSellerInClause(context.sellerIds);

  return Prisma.sql`
    WITH
    ${buildWorkbenchCoreCtes(sellerIn, context.shoplingSnapshotDate)}
  `;
}

export function buildWorkbenchDisplayQueryPrefix(
  context: WorkbenchQueryContext,
): Prisma.Sql {
  const sellerIn = buildSellerInClause(context.sellerIds);

  return Prisma.sql`
    WITH
    ${buildWorkbenchCoreCtes(sellerIn, context.shoplingSnapshotDate)},
    ${buildWorkbenchDisplayCtes(sellerIn)}
  `;
}

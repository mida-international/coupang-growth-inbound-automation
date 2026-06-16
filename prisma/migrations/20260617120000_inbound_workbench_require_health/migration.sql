-- Require matching coupang_growth_inventory_health row per template option_id
CREATE OR REPLACE VIEW inbound_workbench_v AS
WITH template_snapshot AS (
  SELECT
    coupang_seller_account_id,
    MAX(snapshot_date) AS max_date
  FROM coupang_growth_inbound_template
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
  GROUP BY coupang_seller_account_id
),
health_latest AS (
  SELECT h.*
  FROM coupang_growth_inventory_health h
  INNER JOIN health_snapshot hs
    ON h.coupang_seller_account_id = hs.coupang_seller_account_id
    AND h.snapshot_date = hs.max_date
),
shopling_max AS (
  SELECT MAX(snapshot_date) AS max_date
  FROM shopling_inventory
),
shopling_latest AS (
  SELECT s.*
  FROM shopling_inventory s
  CROSS JOIN shopling_max sm
  WHERE s.snapshot_date = sm.max_date
)
SELECT
  t.id AS template_id,
  t.coupang_seller_account_id,
  t.option_id,
  t.registered_product_name,
  t.option_name,
  t.product_barcode,
  t.snapshot_date AS template_snapshot_date,
  h.snapshot_date AS health_snapshot_date,
  sm.max_date AS shopling_snapshot_date,
  COALESCE(s.id::text, 'none') AS shopling_row_key,
  COALESCE(s.available_stock, 0) AS shopling_available_stock,
  s.ptn_goods_cd,
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
CROSS JOIN shopling_max sm
INNER JOIN health_latest h
  ON t.coupang_seller_account_id = h.coupang_seller_account_id
  AND t.option_id IS NOT NULL
  AND h.option_id IS NOT NULL
  AND t.option_id = h.option_id
LEFT JOIN shopling_latest s
  ON t.product_barcode IS NOT NULL
  AND TRIM(t.product_barcode) <> ''
  AND t.product_barcode = s.barcode;

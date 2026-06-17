CREATE OR REPLACE VIEW coupang_inbound_daily_v AS
SELECT
  coupang_seller_account_id,
  TRIM(product_barcode) AS product_barcode,
  ((recorded_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul')::date AS record_date,
  SUM(quantity)::integer AS quantity
FROM coupang_inbound_record
WHERE quantity > 0
  AND TRIM(product_barcode) <> ''
GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW warehouse_inbound_daily_v AS
SELECT
  d.coupang_seller_account_id,
  TRIM(i.product_barcode) AS product_barcode,
  i.record_date,
  SUM(i.quantity)::integer AS quantity
FROM warehouse_inbound_deliverable_item i
INNER JOIN warehouse_inbound_deliverable d ON d.id = i.deliverable_id
WHERE i.quantity > 0
  AND i.product_barcode IS NOT NULL
  AND TRIM(i.product_barcode) <> ''
GROUP BY 1, 2, 3;

DROP VIEW IF EXISTS inbound_trends_row_v;
DROP VIEW IF EXISTS inbound_workbench_display_v;
DROP VIEW IF EXISTS inbound_workbench_v;

CREATE VIEW inbound_workbench_v AS
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
  t.registered_product_id,
  t.registered_product_name,
  t.option_name,
  t.product_barcode,
  t.snapshot_date AS template_snapshot_date,
  h.snapshot_date AS health_snapshot_date,
  sm.max_date AS shopling_snapshot_date,
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

CREATE VIEW inbound_workbench_display_v AS
SELECT
  v.*,
  COALESCE(o.safety_stock, 0) AS safety_stock,
  COALESCE(o.growth_inbound_recommend_qty, v.calculated_growth_inbound_recommend)
    AS growth_inbound_recommend,
  COALESCE(ap.actual_packed_qty, 0) AS actual_packed_qty,
  r.rotation_1_qty,
  r.rotation_1_date,
  r.rotation_2_qty,
  r.rotation_2_date,
  r.rotation_3_qty,
  r.rotation_3_date
FROM inbound_workbench_v v
LEFT JOIN inbound_planning_override o
  ON v.coupang_seller_account_id = o.coupang_seller_account_id
  AND (
    (v.option_id IS NOT NULL AND v.option_id = o.option_id)
    OR (v.option_id IS NULL AND v.template_id = o.template_id)
  )
LEFT JOIN inbound_rotation_v r
  ON v.coupang_seller_account_id = r.coupang_seller_account_id
  AND v.product_barcode IS NOT NULL
  AND TRIM(v.product_barcode) <> ''
  AND TRIM(v.product_barcode) = r.product_barcode
LEFT JOIN inbound_actual_packed_v ap
  ON v.coupang_seller_account_id = ap.coupang_seller_account_id
  AND v.product_barcode IS NOT NULL
  AND TRIM(v.product_barcode) <> ''
  AND TRIM(v.product_barcode) = ap.product_barcode;

CREATE VIEW inbound_trends_row_v AS
SELECT
  coupang_seller_account_id,
  shopling_row_key,
  registered_product_id,
  option_id,
  ptn_goods_cd,
  shopling_option_value,
  product_barcode,
  registered_product_name,
  option_name
FROM inbound_workbench_display_v;

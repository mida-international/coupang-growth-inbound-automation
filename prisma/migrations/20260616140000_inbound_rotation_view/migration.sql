CREATE OR REPLACE VIEW inbound_rotation_v AS
WITH daily AS (
  SELECT
    coupang_seller_account_id,
    TRIM(product_barcode) AS product_barcode,
    ((recorded_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul')::date AS inbound_kst_date,
    SUM(quantity)::integer AS daily_qty
  FROM coupang_inbound_record
  WHERE quantity > 0
    AND TRIM(product_barcode) <> ''
  GROUP BY 1, 2, 3
),
ranked AS (
  SELECT
    coupang_seller_account_id,
    product_barcode,
    inbound_kst_date,
    daily_qty,
    ROW_NUMBER() OVER (
      PARTITION BY coupang_seller_account_id, product_barcode
      ORDER BY inbound_kst_date DESC
    ) AS rotation_rank
  FROM daily
)
SELECT
  coupang_seller_account_id,
  product_barcode,
  MAX(daily_qty) FILTER (WHERE rotation_rank = 1) AS rotation_1_qty,
  MAX(inbound_kst_date) FILTER (WHERE rotation_rank = 1) AS rotation_1_date,
  MAX(daily_qty) FILTER (WHERE rotation_rank = 2) AS rotation_2_qty,
  MAX(inbound_kst_date) FILTER (WHERE rotation_rank = 2) AS rotation_2_date,
  MAX(daily_qty) FILTER (WHERE rotation_rank = 3) AS rotation_3_qty,
  MAX(inbound_kst_date) FILTER (WHERE rotation_rank = 3) AS rotation_3_date
FROM ranked
WHERE rotation_rank <= 3
GROUP BY coupang_seller_account_id, product_barcode;

DROP VIEW IF EXISTS inbound_workbench_display_v;

CREATE OR REPLACE VIEW inbound_workbench_display_v AS
SELECT
  v.*,
  COALESCE(o.safety_stock, 0) AS safety_stock,
  COALESCE(o.growth_inbound_recommend_qty, v.calculated_growth_inbound_recommend)
    AS growth_inbound_recommend,
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
  AND TRIM(v.product_barcode) = r.product_barcode;

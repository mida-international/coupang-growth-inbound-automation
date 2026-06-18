DROP VIEW IF EXISTS inbound_trends_row_v;
DROP VIEW IF EXISTS inbound_workbench_display_v;

CREATE VIEW inbound_workbench_display_v AS
SELECT
  v.*,
  COALESCE(o.safety_stock, 0) AS safety_stock,
  COALESCE(o.growth_inbound_recommend_qty, v.calculated_growth_inbound_recommend)
    AS growth_inbound_recommend,
  GREATEST(
    0,
    v.shopling_available_stock
      - COALESCE(o.growth_inbound_recommend_qty, v.calculated_growth_inbound_recommend)
  ) AS remaining_after_inbound,
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

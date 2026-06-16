ALTER TABLE "CoupangSellerAccount"
ADD COLUMN "actual_packed_qty_reset_at" TIMESTAMP(3);

UPDATE "CoupangSellerAccount"
SET "actual_packed_qty_reset_at" = NOW()
WHERE "actual_packed_qty_reset_at" IS NULL;

CREATE OR REPLACE VIEW inbound_actual_packed_v AS
SELECT
  r.coupang_seller_account_id,
  TRIM(r.product_barcode) AS product_barcode,
  COALESCE(SUM(r.quantity), 0)::integer AS actual_packed_qty
FROM coupang_inbound_record r
INNER JOIN "CoupangSellerAccount" a
  ON a.id = r.coupang_seller_account_id
WHERE r.quantity > 0
  AND TRIM(r.product_barcode) <> ''
  AND r.recorded_at >= COALESCE(
    a.actual_packed_qty_reset_at,
    TIMESTAMPTZ '1970-01-01 00:00:00+00'
  )
GROUP BY r.coupang_seller_account_id, TRIM(r.product_barcode);

DROP VIEW IF EXISTS inbound_workbench_display_v;

CREATE OR REPLACE VIEW inbound_workbench_display_v AS
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

import { Prisma } from "@/generated/prisma/client";

export function buildLatestInboundTemplateBarcodesCte(): Prisma.Sql {
  return Prisma.sql`
    template_snapshot AS (
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
    inbound_template_barcodes AS (
      SELECT DISTINCT TRIM(t.product_barcode) AS barcode
      FROM template_latest t
      WHERE t.product_barcode IS NOT NULL
        AND TRIM(t.product_barcode) <> ''
    )
  `;
}

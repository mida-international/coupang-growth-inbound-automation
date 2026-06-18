import { Prisma } from "@/generated/prisma/client";
import { buildLatestInboundTemplateBarcodesCte } from "@/services/shopling-data/latest-inbound-template-barcodes-sql";

export function buildNewOptionProductsSearchCondition(search?: string) {
  const trimmed = search?.trim();

  if (!trimmed) {
    return Prisma.empty;
  }

  const pattern = `%${trimmed}%`;

  return Prisma.sql`AND (
    i.goods_key ILIKE ${pattern}
    OR i.opt_id ILIKE ${pattern}
    OR i.ptn_goods_cd ILIKE ${pattern}
    OR i.barcode ILIKE ${pattern}
  )`;
}

export function buildNewOptionProductsBaseCte(
  from: string,
  to: string,
  searchCondition: Prisma.Sql,
) {
  const inboundTemplateBarcodesCte = buildLatestInboundTemplateBarcodesCte();

  return Prisma.sql`
    WITH first_seen AS (
      SELECT
        opt_id,
        MIN(snapshot_date) AS first_added_date
      FROM shopling_inventory
      WHERE opt_id IS NOT NULL
        AND TRIM(opt_id) <> ''
      GROUP BY opt_id
    ),
    filtered AS (
      SELECT *
      FROM first_seen
      WHERE first_added_date >= ${from}::date
        AND first_added_date <= ${to}::date
    ),
    ${inboundTemplateBarcodesCte},
    distinct_rows AS (
      SELECT DISTINCT ON (i.opt_id)
        i.goods_key,
        i.opt_id,
        i.ptn_goods_cd,
        i.option_value,
        i.barcode,
        f.first_added_date
      FROM filtered f
      INNER JOIN shopling_inventory i
        ON i.opt_id = f.opt_id
        AND i.snapshot_date = f.first_added_date
      WHERE TRUE
      ${searchCondition}
      ORDER BY i.opt_id, i.goods_key ASC, i.barcode ASC
    ),
    visible_rows AS (
      SELECT dr.*
      FROM distinct_rows dr
      WHERE NOT EXISTS (
        SELECT 1
        FROM inbound_template_barcodes itb
        WHERE TRIM(dr.barcode) = itb.barcode
      )
    )
  `;
}

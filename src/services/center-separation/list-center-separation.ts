import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type {
  CenterSeparationRowView,
  ListCenterSeparationResult,
} from "@/services/center-separation/types";
import { normalizeCenterSeparationPageSize } from "@/services/center-separation/types";

type ListCenterSeparationOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  exportAll?: boolean;
};

type RawCenterSeparationRow = {
  id: string;
  barcode: string;
  created_at: Date;
  updated_at: Date;
  registered_product_name: string | null;
  option_name: string | null;
  ptn_goods_cd: string | null;
  shopling_option_value: string | null;
};

function buildSearchCondition(search?: string) {
  const trimmed = search?.trim();

  if (!trimmed) {
    return Prisma.empty;
  }

  const pattern = `%${trimmed}%`;

  return Prisma.sql`AND (
    cs.barcode ILIKE ${pattern}
    OR EXISTS (
      SELECT 1
      FROM inbound_trends_row_v d
      WHERE d.product_barcode IS NOT NULL
        AND TRIM(d.product_barcode) = TRIM(cs.barcode)
        AND (
          d.registered_product_name ILIKE ${pattern}
          OR d.option_name ILIKE ${pattern}
          OR d.ptn_goods_cd ILIKE ${pattern}
          OR d.shopling_option_value ILIKE ${pattern}
        )
    )
  )`;
}

function mapRow(row: RawCenterSeparationRow): CenterSeparationRowView {
  return {
    id: row.id,
    barcode: row.barcode,
    registeredProductName: row.registered_product_name,
    optionName: row.option_name,
    ptnGoodsCd: row.ptn_goods_cd,
    shoplingOptionValue: row.shopling_option_value,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listCenterSeparation(
  options: ListCenterSeparationOptions = {},
): Promise<ListCenterSeparationResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = normalizeCenterSeparationPageSize(options.pageSize);
  const exportAll = options.exportAll === true;
  const searchCondition = buildSearchCondition(options.search);
  const offset = (page - 1) * pageSize;
  const paginationClause = exportAll
    ? Prisma.empty
    : Prisma.sql`LIMIT ${pageSize} OFFSET ${offset}`;

  const [countResult, rows] = await Promise.all([
    prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM coupang_center_separation cs
        WHERE TRUE
        ${searchCondition}
      `,
    ),
    prisma.$queryRaw<RawCenterSeparationRow[]>(
      Prisma.sql`
        WITH filtered AS (
          SELECT
            cs.id,
            cs.barcode,
            cs.created_at,
            cs.updated_at
          FROM coupang_center_separation cs
          WHERE TRUE
          ${searchCondition}
        ),
        paged AS (
          SELECT *
          FROM filtered
          ORDER BY barcode ASC
          ${paginationClause}
        ),
        dashboard_lookup AS (
          SELECT DISTINCT ON (TRIM(product_barcode))
            TRIM(product_barcode) AS product_barcode,
            registered_product_name,
            option_name,
            ptn_goods_cd,
            shopling_option_value
          FROM inbound_trends_row_v
          WHERE product_barcode IS NOT NULL
            AND TRIM(product_barcode) <> ''
            AND TRIM(product_barcode) IN (SELECT TRIM(barcode) FROM paged)
          ORDER BY TRIM(product_barcode), registered_product_name NULLS LAST
        )
        SELECT
          p.id,
          p.barcode,
          p.created_at,
          p.updated_at,
          d.registered_product_name,
          d.option_name,
          d.ptn_goods_cd,
          d.shopling_option_value
        FROM paged p
        LEFT JOIN dashboard_lookup d
          ON TRIM(p.barcode) = d.product_barcode
        ORDER BY p.barcode ASC
      `,
    ),
  ]);

  return {
    totalCount: Number(countResult[0]?.count ?? 0),
    rows: rows.map(mapRow),
  };
}

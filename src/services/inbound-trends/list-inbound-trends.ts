import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  buildTrendsQuantityMaps,
  mergeTrendsDateValues,
  type DailyQuantityRow,
} from "@/services/inbound-trends/merge-trends-quantities";
import { resolveTrendsDateRange } from "@/services/inbound-trends/resolve-trends-date-range";
import type {
  InboundTrendsRowView,
  ListInboundTrendsResult,
} from "@/services/inbound-trends/types";
import { normalizeInboundTrendsPageSize } from "@/services/inbound-trends/types";

type ListInboundTrendsOptions = {
  coupangSellerAccountId: string;
  from?: string;
  to?: string;
  days?: string | number;
  page?: number;
  pageSize?: number;
  search?: string;
};

type RawTrendsRow = {
  shopling_row_key: string;
  option_id: bigint | null;
  ptn_goods_cd: string | null;
  shopling_option_value: string | null;
  product_barcode: string | null;
  registered_product_name: string | null;
  option_name: string | null;
};

function formatSnapshotDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

async function fetchSnapshotDates(coupangSellerAccountId: string) {
  const [template, health, shopling] = await Promise.all([
    prisma.coupangGrowthInboundTemplate.aggregate({
      where: { coupangSellerAccountId },
      _max: { snapshotDate: true },
    }),
    prisma.coupangGrowthInventoryHealth.aggregate({
      where: { coupangSellerAccountId },
      _max: { snapshotDate: true },
    }),
    prisma.shoplingInventory.aggregate({
      _max: { snapshotDate: true },
    }),
  ]);

  if (!template._max.snapshotDate) {
    return null;
  }

  return {
    template: formatSnapshotDate(template._max.snapshotDate),
    health: health._max.snapshotDate
      ? formatSnapshotDate(health._max.snapshotDate)
      : null,
    shopling: shopling._max.snapshotDate
      ? formatSnapshotDate(shopling._max.snapshotDate)
      : null,
  };
}

function buildSearchCondition(search?: string) {
  const trimmed = search?.trim();

  if (!trimmed) {
    return Prisma.empty;
  }

  const pattern = `%${trimmed}%`;

  return Prisma.sql`AND (
    d.registered_product_name ILIKE ${pattern}
    OR d.option_name ILIKE ${pattern}
    OR d.product_barcode ILIKE ${pattern}
    OR d.ptn_goods_cd ILIKE ${pattern}
  )`;
}

function mapRow(
  row: RawTrendsRow,
  dates: string[],
  maps: ReturnType<typeof buildTrendsQuantityMaps>,
): InboundTrendsRowView {
  const optionId = row.option_id?.toString() ?? "none";

  return {
    rowKey: `${optionId}|${row.shopling_row_key}`,
    registeredProductName: row.registered_product_name,
    optionName: row.option_name,
    ptnGoodsCd: row.ptn_goods_cd,
    shoplingOptionValue: row.shopling_option_value,
    productBarcode: row.product_barcode,
    dateValues: mergeTrendsDateValues(row.product_barcode, dates, maps),
  };
}

export async function listInboundTrends(
  options: ListInboundTrendsOptions,
): Promise<ListInboundTrendsResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = normalizeInboundTrendsPageSize(options.pageSize);
  const sellerId = options.coupangSellerAccountId;
  const dateRange = resolveTrendsDateRange({
    from: options.from,
    to: options.to,
    days: options.days,
  });
  const searchCondition = buildSearchCondition(options.search);

  const snapshotDates = await fetchSnapshotDates(sellerId);

  if (!snapshotDates) {
    return {
      snapshotDates: null,
      totalCount: 0,
      rows: [],
      dates: dateRange.dates,
      dateRange: {
        from: dateRange.from,
        to: dateRange.to,
        days: dateRange.days,
      },
    };
  }

  const baseWhere = Prisma.sql`
    WHERE d.coupang_seller_account_id = ${sellerId}
    ${searchCondition}
  `;

  const fromDate = new Date(`${dateRange.from}T00:00:00.000Z`);
  const toDate = new Date(`${dateRange.to}T00:00:00.000Z`);

  const [countResult, baseRows, coupangDaily, warehouseDaily] =
    await Promise.all([
      prisma.$queryRaw<[{ count: bigint }]>(
        Prisma.sql`
          SELECT COUNT(*)::bigint AS count
          FROM inbound_trends_row_v d
          ${baseWhere}
        `,
      ),
      prisma.$queryRaw<RawTrendsRow[]>(
        Prisma.sql`
          SELECT
            d.shopling_row_key,
            d.option_id,
            d.ptn_goods_cd,
            d.shopling_option_value,
            d.product_barcode,
            d.registered_product_name,
            d.option_name
          FROM inbound_trends_row_v d
          ${baseWhere}
          ORDER BY d.registered_product_name ASC NULLS LAST, d.option_id ASC NULLS LAST, d.shopling_row_key ASC
          LIMIT ${pageSize}
          OFFSET ${(page - 1) * pageSize}
        `,
      ),
      prisma.$queryRaw<DailyQuantityRow[]>(
        Prisma.sql`
          SELECT product_barcode, record_date, quantity
          FROM coupang_inbound_daily_v
          WHERE coupang_seller_account_id = ${sellerId}
            AND record_date >= ${fromDate}::date
            AND record_date <= ${toDate}::date
        `,
      ),
      prisma.$queryRaw<DailyQuantityRow[]>(
        Prisma.sql`
          SELECT product_barcode, record_date, quantity
          FROM warehouse_inbound_daily_v
          WHERE coupang_seller_account_id = ${sellerId}
            AND record_date >= ${fromDate}::date
            AND record_date <= ${toDate}::date
        `,
      ),
    ]);

  const maps = buildTrendsQuantityMaps(coupangDaily, warehouseDaily);

  return {
    snapshotDates,
    totalCount: Number(countResult[0]?.count ?? 0),
    rows: baseRows.map((row) => mapRow(row, dateRange.dates, maps)),
    dates: dateRange.dates,
    dateRange: {
      from: dateRange.from,
      to: dateRange.to,
      days: dateRange.days,
    },
  };
}

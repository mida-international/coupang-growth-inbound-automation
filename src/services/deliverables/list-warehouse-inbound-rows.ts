import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type {
  ListWarehouseInboundRowsResult,
  WarehouseInboundListRow,
} from "@/services/deliverables/types";

type ListWarehouseInboundRowsOptions = {
  coupangSellerAccountId: string;
};

type RawWarehouseInboundRow = {
  location: string | null;
  registered_product_name: string | null;
  option_name: string | null;
  product_barcode: string | null;
  growth_inbound_recommend: number;
  template_snapshot_date: Date | null;
  shopling_snapshot_date: Date | null;
};

function formatSnapshotDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function mapRow(row: RawWarehouseInboundRow): WarehouseInboundListRow {
  return {
    location: row.location,
    registeredProductName: row.registered_product_name,
    optionName: row.option_name,
    productBarcode: row.product_barcode,
    growthInboundRecommend: row.growth_inbound_recommend,
  };
}

export async function listWarehouseInboundRows(
  options: ListWarehouseInboundRowsOptions,
): Promise<ListWarehouseInboundRowsResult> {
  const sellerId = options.coupangSellerAccountId;

  const rows = await prisma.$queryRaw<RawWarehouseInboundRow[]>(
    Prisma.sql`
      SELECT
        location,
        registered_product_name,
        option_name,
        product_barcode,
        growth_inbound_recommend,
        template_snapshot_date,
        shopling_snapshot_date
      FROM inbound_workbench_display_v
      WHERE coupang_seller_account_id = ${sellerId}
        AND growth_inbound_recommend > 0
      ORDER BY location ASC NULLS LAST,
               registered_product_name ASC NULLS LAST,
               option_name ASC NULLS LAST
    `,
  );

  if (rows.length === 0) {
    const [template, shopling] = await Promise.all([
      prisma.coupangGrowthInboundTemplate.aggregate({
        where: { coupangSellerAccountId: sellerId },
        _max: { snapshotDate: true },
      }),
      prisma.shoplingInventory.aggregate({
        _max: { snapshotDate: true },
      }),
    ]);

    if (!template._max.snapshotDate) {
      return {
        snapshotDates: null,
        rowCount: 0,
        rows: [],
      };
    }

    return {
      snapshotDates: {
        template: formatSnapshotDate(template._max.snapshotDate),
        shopling: shopling._max.snapshotDate
          ? formatSnapshotDate(shopling._max.snapshotDate)
          : null,
      },
      rowCount: 0,
      rows: [],
    };
  }

  const firstRow = rows[0];

  return {
    snapshotDates: {
      template: firstRow.template_snapshot_date
        ? formatSnapshotDate(firstRow.template_snapshot_date)
        : null,
      shopling: firstRow.shopling_snapshot_date
        ? formatSnapshotDate(firstRow.shopling_snapshot_date)
        : null,
    },
    rowCount: rows.length,
    rows: rows.map(mapRow),
  };
}

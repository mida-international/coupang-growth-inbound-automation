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

/**
 * 샵플링 재고를 고려하지 않는 버전.
 *
 * 기존 `listWarehouseInboundRows`(= inbound_workbench_display_v의
 * growth_inbound_recommend)는 추천 수량을 `LEAST(소요량, 샵플링_가용재고)`로
 * 샵플링 재고 상한을 걸고, 샵플링에 없는 상품(재고 0)은 추천 0으로 제외한다.
 *
 * 이 함수는 그 상한만 제거해, 판매추세 기반 소요량을 그대로 추천으로 사용한다
 * (수동 override는 기존과 동일하게 우선 적용). 즉:
 *   추천 = COALESCE(override,
 *            GREATEST(0, MAX(30일판매, 7일판매×3) − 미착입고 − 주문가능수량))
 * 샵플링에 없는 상품도 소요량이 있으면 포함된다.
 *
 * 기존 뷰/로직은 전혀 건드리지 않고 표시 뷰의 원자재 컬럼으로 새로 계산한다.
 */
export async function listWarehouseInboundRowsIgnoringShoplingStock(
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
      FROM (
        SELECT
          v.location,
          v.registered_product_name,
          v.option_name,
          v.product_barcode,
          v.template_snapshot_date,
          v.shopling_snapshot_date,
          COALESCE(
            o.growth_inbound_recommend_qty,
            GREATEST(
              0,
              GREATEST(v.recent_sales_qty_30days, v.recent_sales_qty_7days * 3)
                - v.pending_inbounds
                - v.orderable_quantity
            )
          ) AS growth_inbound_recommend
        FROM inbound_workbench_display_v v
        LEFT JOIN inbound_planning_override o
          ON v.coupang_seller_account_id = o.coupang_seller_account_id
          AND (
            (v.option_id IS NOT NULL AND v.option_id = o.option_id)
            OR (v.option_id IS NULL AND v.template_id = o.template_id)
          )
        WHERE v.coupang_seller_account_id = ${sellerId}
      ) sub
      WHERE growth_inbound_recommend > 0
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

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
 * "샵플링 재고 0 누락분" — 입고 필요량은 계산되는데 샵플링 가용재고가 0(또는
 * 샵플링에 아예 없음)이라 표준 리스트에서 빠진 상품만 모은 목록.
 *
 * 표준(`listWarehouseInboundRows`)은 추천 = LEAST(소요량, 샵플링_가용재고)라서
 * 샵플링 재고가 0이면 추천이 0으로 잘려 `> 0` 필터에서 제외된다. 이 함수는 바로
 * 그 "샵플링 0 때문에 빠진" 항목만 골라, 잘리기 전 계산 소요량을 수량으로 준다:
 *   수량 = GREATEST(0, MAX(30일판매, 7일판매×3) − 미착입고 − 주문가능수량)
 *
 * 조건: 샵플링 가용재고 = 0  AND  수동 override 없음  AND  위 계산 소요량 > 0.
 * (override가 있으면 표준에서 그 값으로 이미 나가므로 "못 나간" 게 아니라서 제외)
 *
 * 기존 뷰/로직은 전혀 건드리지 않고 표시 뷰의 원자재 컬럼으로 계산한다.
 */
export async function listWarehouseInboundRowsShoplingZeroShortage(
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
          GREATEST(
            0,
            GREATEST(v.recent_sales_qty_30days, v.recent_sales_qty_7days * 3)
              - v.pending_inbounds
              - v.orderable_quantity
          ) AS growth_inbound_recommend
        FROM inbound_workbench_display_v v
        LEFT JOIN inbound_planning_override o
          ON v.coupang_seller_account_id = o.coupang_seller_account_id
          AND (
            (v.option_id IS NOT NULL AND v.option_id = o.option_id)
            OR (v.option_id IS NULL AND v.template_id = o.template_id)
          )
        WHERE v.coupang_seller_account_id = ${sellerId}
          -- 샵플링 가용재고 0(또는 샵플링에 없음)
          AND v.shopling_available_stock = 0
          -- 수동 조정이 없는 순수 계산 항목만 (override 있으면 표준에서 이미 나감)
          AND o.growth_inbound_recommend_qty IS NULL
      ) sub
      -- 그러나 계산상 입고 필요량은 있는 것만
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

"use client";

import type { ReactNode } from "react";

import { EditableIntegerCell } from "@/components/inbound-workbench/editable-integer-cell";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT_COLUMN_WIDTHS } from "@/services/inbound-workbench/inbound-workbench-column-layout";
import type { InboundWorkbenchSortColumn } from "@/services/inbound-workbench/inbound-workbench-sort";
import type { InboundWorkbenchRowView } from "@/services/inbound-workbench/types";

const GROWTH_INBOUND_RECOMMEND_TOOLTIP =
  "판매기준수요(max(30일, 7일×3)) − 쿠팡입고예정 − 쿠팡윙재고, 음수면 0, 샵플링 가용재고로 상한. 클릭하여 수정 가능.";

const ACTUAL_PACKED_QTY_TOOLTIP =
  "바코드별 입고 기록 누적. 재고 현황 업로드 시 리셋. 0보다 크면 노란색 표시.";

const SAFETY_STOCK_TOOLTIP =
  "안전재고 (수동 입력). 가용재고가 안전재고 미만이면 적색 경고. 클릭하여 수정 가능.";

export const SAFETY_STOCK_HIGHLIGHT_CLASS = "bg-yellow-50";
export const GROWTH_INBOUND_RECOMMEND_HIGHLIGHT_CLASS = "bg-green-50";
export const SHOPLING_STOCK_LOW_CLASS = "bg-red-50 text-destructive";

const ROTATION_TOOLTIPS = {
  rotation1Qty:
    "바코드별 KST 기준 최근 입고일 1번째 일자의 입고 수량 합계",
  rotation2Qty:
    "바코드별 KST 기준 최근 입고일 2번째 일자의 입고 수량 합계",
  rotation3Qty:
    "바코드별 KST 기준 최근 입고일 3번째 일자의 입고 수량 합계",
} as const;

export type InboundWorkbenchDraftEntry = {
  safetyStock: number;
  growthInboundRecommend: number;
  initialSafetyStock: number;
  initialGrowthInboundRecommend: number;
};

export type InboundWorkbenchCellContext = {
  editMode: boolean;
  isFirstForKey: boolean;
  overrideKey: string;
  draft?: InboundWorkbenchDraftEntry;
  safetyHighlighted: boolean;
  growthHighlighted: boolean;
  shoplingBelowSafety: boolean;
  actualPackedHighlighted: boolean;
  onDraftChange?: (
    key: string,
    field: "safetyStock" | "growthInboundRecommend",
    value: number,
  ) => void;
};

export type InboundWorkbenchColumnDef = {
  id: InboundWorkbenchSortColumn;
  label: string;
  align: "left" | "right";
  defaultWidth: number;
  tooltip?: ReactNode;
  cellClassName?: string;
  renderCell: (row: InboundWorkbenchRowView, ctx: InboundWorkbenchCellContext) => ReactNode;
};

function formatCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "-";
  }

  return value;
}

function formatRotationQty(qty: number | null): string {
  if (qty === null) {
    return "-";
  }

  return qty.toLocaleString();
}

function RotationCell({
  qty,
  date,
}: {
  qty: number | null;
  date: string | null;
}) {
  if (qty === null) {
    return "-";
  }

  const formatted = formatRotationQty(qty);

  if (!date) {
    return formatted;
  }

  return (
    <Tooltip>
      <TooltipTrigger>{formatted}</TooltipTrigger>
      <TooltipContent>입고일: {date}</TooltipContent>
    </Tooltip>
  );
}

export const INBOUND_WORKBENCH_COLUMN_DEFS: Record<
  InboundWorkbenchSortColumn,
  InboundWorkbenchColumnDef
> = {
  registeredProductName: {
    id: "registeredProductName",
    label: "상품명",
    align: "left",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.registeredProductName,
    renderCell: (row) => formatCell(row.registeredProductName),
  },
  optionName: {
    id: "optionName",
    label: "옵션명",
    align: "left",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.optionName,
    renderCell: (row) => formatCell(row.optionName),
  },
  productBarcode: {
    id: "productBarcode",
    label: "바코드",
    align: "left",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.productBarcode,
    renderCell: (row) => formatCell(row.productBarcode),
  },
  shoplingAvailableStock: {
    id: "shoplingAvailableStock",
    label: "샵플링재고",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.shoplingAvailableStock,
    cellClassName: "text-right",
    renderCell: (row, ctx) =>
      ctx.shoplingBelowSafety ? (
        <Tooltip>
          <TooltipTrigger className="cursor-help">
            {row.shoplingAvailableStock.toLocaleString()}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm text-left">
            샵플링 가용재고({row.shoplingAvailableStock.toLocaleString()})가
            안전재고({row.safetyStock.toLocaleString()}) 미만입니다.
          </TooltipContent>
        </Tooltip>
      ) : (
        row.shoplingAvailableStock.toLocaleString()
      ),
  },
  ptnGoodsCd: {
    id: "ptnGoodsCd",
    label: "자사상품코드",
    align: "left",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.ptnGoodsCd,
    renderCell: (row) => formatCell(row.ptnGoodsCd),
  },
  orderableQuantity: {
    id: "orderableQuantity",
    label: "쿠팡윙재고",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.orderableQuantity,
    cellClassName: "text-right",
    renderCell: (row) => row.orderableQuantity.toLocaleString(),
  },
  salesQty60days: {
    id: "salesQty60days",
    label: "60일판매",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.salesQty60days,
    cellClassName: "text-right",
    renderCell: (row) => row.salesQty60days.toLocaleString(),
  },
  recentSalesQty7days: {
    id: "recentSalesQty7days",
    label: "7일판매",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.recentSalesQty7days,
    cellClassName: "text-right",
    renderCell: (row) => row.recentSalesQty7days.toLocaleString(),
  },
  recentSalesQty30days: {
    id: "recentSalesQty30days",
    label: "30일판매",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.recentSalesQty30days,
    cellClassName: "text-right",
    renderCell: (row) => row.recentSalesQty30days.toLocaleString(),
  },
  recommendedInboundQty: {
    id: "recommendedInboundQty",
    label: "쿠팡자체추천",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.recommendedInboundQty,
    cellClassName: "text-right",
    renderCell: (row) => row.recommendedInboundQty.toLocaleString(),
  },
  pendingInbounds: {
    id: "pendingInbounds",
    label: "쿠팡입고예정",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.pendingInbounds,
    cellClassName: "text-right",
    renderCell: (row) => row.pendingInbounds.toLocaleString(),
  },
  safetyStock: {
    id: "safetyStock",
    label: "안전재고",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.safetyStock,
    tooltip: SAFETY_STOCK_TOOLTIP,
    cellClassName: "text-right",
    renderCell: (row, ctx) => (
      <EditableIntegerCell
        value={row.safetyStock}
        editable={ctx.editMode && ctx.isFirstForKey}
        highlighted={ctx.safetyHighlighted}
        highlightClassName={SAFETY_STOCK_HIGHLIGHT_CLASS}
        muted={ctx.editMode && !ctx.isFirstForKey}
        onChange={(value) =>
          ctx.onDraftChange?.(ctx.overrideKey, "safetyStock", value)
        }
      />
    ),
  },
  growthInboundRecommend: {
    id: "growthInboundRecommend",
    label: "쿠팡그로스 입고추천",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.growthInboundRecommend,
    tooltip: GROWTH_INBOUND_RECOMMEND_TOOLTIP,
    cellClassName: "text-right",
    renderCell: (row, ctx) => (
      <EditableIntegerCell
        value={row.growthInboundRecommend}
        editable={ctx.editMode && ctx.isFirstForKey}
        highlighted={ctx.growthHighlighted}
        highlightClassName={GROWTH_INBOUND_RECOMMEND_HIGHLIGHT_CLASS}
        muted={ctx.editMode && !ctx.isFirstForKey}
        onChange={(value) =>
          ctx.onDraftChange?.(ctx.overrideKey, "growthInboundRecommend", value)
        }
      />
    ),
  },
  actualPackedQty: {
    id: "actualPackedQty",
    label: "실포장수량",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.actualPackedQty,
    tooltip: ACTUAL_PACKED_QTY_TOOLTIP,
    cellClassName: "text-right",
    renderCell: (row) => row.actualPackedQty.toLocaleString(),
  },
  rotation1Qty: {
    id: "rotation1Qty",
    label: "1회전",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.rotation1Qty,
    tooltip: ROTATION_TOOLTIPS.rotation1Qty,
    cellClassName: "text-right",
    renderCell: (row) => (
      <RotationCell qty={row.rotation1Qty} date={row.rotation1Date} />
    ),
  },
  rotation2Qty: {
    id: "rotation2Qty",
    label: "2회전",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.rotation2Qty,
    tooltip: ROTATION_TOOLTIPS.rotation2Qty,
    cellClassName: "text-right",
    renderCell: (row) => (
      <RotationCell qty={row.rotation2Qty} date={row.rotation2Date} />
    ),
  },
  rotation3Qty: {
    id: "rotation3Qty",
    label: "3회전",
    align: "right",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.rotation3Qty,
    tooltip: ROTATION_TOOLTIPS.rotation3Qty,
    cellClassName: "text-right",
    renderCell: (row) => (
      <RotationCell qty={row.rotation3Qty} date={row.rotation3Date} />
    ),
  },
  offerCondition: {
    id: "offerCondition",
    label: "등급",
    align: "left",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.offerCondition,
    renderCell: (row) => formatCell(row.offerCondition),
  },
  daysOfCover: {
    id: "daysOfCover",
    label: "소진예상일",
    align: "left",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.daysOfCover,
    renderCell: (row) => formatCell(row.daysOfCover),
  },
  location: {
    id: "location",
    label: "위치",
    align: "left",
    defaultWidth: DEFAULT_COLUMN_WIDTHS.location,
    renderCell: (row) => formatCell(row.location),
  },
};

export function getInboundWorkbenchColumnDef(
  columnId: InboundWorkbenchSortColumn,
): InboundWorkbenchColumnDef {
  return INBOUND_WORKBENCH_COLUMN_DEFS[columnId];
}

export function isShoplingStockBelowSafetyStock(
  shoplingAvailableStock: number,
  safetyStock: number,
): boolean {
  return safetyStock > 0 && shoplingAvailableStock < safetyStock;
}

export function isSafetyStockHighlighted(
  row: InboundWorkbenchRowView,
  draft?: InboundWorkbenchDraftEntry,
): boolean {
  if (draft) {
    return (
      draft.safetyStock !== draft.initialSafetyStock ||
      draft.initialSafetyStock !== 0
    );
  }

  return row.safetyStock !== 0;
}

export function isActualPackedQtyHighlighted(actualPackedQty: number): boolean {
  return actualPackedQty > 0;
}

export function isGrowthInboundRecommendHighlighted(
  row: InboundWorkbenchRowView,
  draft?: InboundWorkbenchDraftEntry,
): boolean {
  if (
    draft &&
    draft.growthInboundRecommend !== draft.initialGrowthInboundRecommend
  ) {
    return true;
  }

  return row.growthInboundRecommend !== row.calculatedGrowthInboundRecommend;
}

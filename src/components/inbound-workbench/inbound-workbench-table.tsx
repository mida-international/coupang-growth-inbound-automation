"use client";

import { EditableIntegerCell } from "@/components/inbound-workbench/editable-integer-cell";
import { SortableTableHead } from "@/components/inbound-workbench/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { InboundWorkbenchRowView } from "@/services/inbound-workbench/types";
import { getInboundWorkbenchOverrideKey } from "@/services/inbound-workbench/types";
import type {
  InboundWorkbenchSortColumn,
  InboundWorkbenchSortDirection,
} from "@/services/inbound-workbench/inbound-workbench-sort";

const GROWTH_INBOUND_RECOMMEND_TOOLTIP =
  "판매기준수요(max(30일, 7일×3)) − 쿠팡입고예정 − 쿠팡윙재고, 음수면 0, 샵플링 가용재고로 상한. 클릭하여 수정 가능.";

const ACTUAL_PACKED_QTY_TOOLTIP =
  "바코드별 입고 기록 누적. 재고 현황 업로드 시 리셋. 0보다 크면 노란색 표시.";

const SAFETY_STOCK_TOOLTIP =
  "안전재고 (수동 입력). 가용재고가 안전재고 미만이면 적색 경고. 클릭하여 수정 가능.";

const SAFETY_STOCK_HIGHLIGHT_CLASS = "bg-yellow-50";
const GROWTH_INBOUND_RECOMMEND_HIGHLIGHT_CLASS = "bg-green-50";
const SHOPLING_STOCK_LOW_CLASS = "bg-red-50 text-destructive";

const ROTATION_TOOLTIPS = {
  1: "바코드별 KST 기준 최근 입고일 1번째 일자의 입고 수량 합계",
  2: "바코드별 KST 기준 최근 입고일 2번째 일자의 입고 수량 합계",
  3: "바코드별 KST 기준 최근 입고일 3번째 일자의 입고 수량 합계",
} as const;

export type InboundWorkbenchDraftEntry = {
  safetyStock: number;
  growthInboundRecommend: number;
  initialSafetyStock: number;
  initialGrowthInboundRecommend: number;
};

function formatRotationQty(qty: number | null): string {
  if (qty === null) {
    return "-";
  }

  return qty.toLocaleString();
}

function RotationTableHead({
  label,
  rank,
  column,
  sort,
  dir,
  onSort,
  disabled,
}: {
  label: string;
  rank: keyof typeof ROTATION_TOOLTIPS;
  column: InboundWorkbenchSortColumn;
  sort: InboundWorkbenchSortColumn | null;
  dir: InboundWorkbenchSortDirection | null;
  onSort: (column: InboundWorkbenchSortColumn) => void;
  disabled?: boolean;
}) {
  return (
    <SortableTableHead
      column={column}
      label={label}
      sort={sort}
      dir={dir}
      onSort={onSort}
      disabled={disabled}
      align="right"
      tooltip={ROTATION_TOOLTIPS[rank]}
    />
  );
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

function formatCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "-";
  }

  return value;
}

function isShoplingStockBelowSafetyStock(
  shoplingAvailableStock: number,
  safetyStock: number,
): boolean {
  return safetyStock > 0 && shoplingAvailableStock < safetyStock;
}

function isSafetyStockHighlighted(
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

function isActualPackedQtyHighlighted(actualPackedQty: number): boolean {
  return actualPackedQty > 0;
}

function isGrowthInboundRecommendHighlighted(
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

type InboundWorkbenchTableProps = {
  rows: InboundWorkbenchRowView[];
  editMode?: boolean;
  sort?: InboundWorkbenchSortColumn | null;
  dir?: InboundWorkbenchSortDirection | null;
  onSort?: (column: InboundWorkbenchSortColumn) => void;
  drafts?: Record<string, InboundWorkbenchDraftEntry>;
  onDraftChange?: (
    key: string,
    field: "safetyStock" | "growthInboundRecommend",
    value: number,
  ) => void;
};

export function InboundWorkbenchTable({
  rows,
  editMode = false,
  sort = null,
  dir = null,
  onSort,
  drafts,
  onDraftChange,
}: InboundWorkbenchTableProps) {
  if (rows.length === 0) {
    return null;
  }

  const editedKeys = new Set<string>();
  const sortDisabled = editMode || !onSort;

  const handleSort = (column: InboundWorkbenchSortColumn) => {
    if (!sortDisabled) {
      onSort?.(column);
    }
  };

  return (
    <TooltipProvider>
      <div className="overflow-hidden rounded-md border border-border bg-background">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <SortableTableHead
                  column="registeredProductName"
                  label="상품명"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                />
                <SortableTableHead
                  column="optionName"
                  label="옵션명"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                />
                <SortableTableHead
                  column="productBarcode"
                  label="바코드"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                />
                <SortableTableHead
                  column="shoplingAvailableStock"
                  label="샵플링재고"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                  align="right"
                />
                <SortableTableHead
                  column="ptnGoodsCd"
                  label="자사상품코드"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                />
                <SortableTableHead
                  column="orderableQuantity"
                  label="쿠팡윙재고"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                  align="right"
                />
                <SortableTableHead
                  column="salesQty60days"
                  label="60일판매"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                  align="right"
                />
                <SortableTableHead
                  column="recentSalesQty7days"
                  label="7일판매"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                  align="right"
                />
                <SortableTableHead
                  column="recentSalesQty30days"
                  label="30일판매"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                  align="right"
                />
                <SortableTableHead
                  column="recommendedInboundQty"
                  label="쿠팡자체추천"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                  align="right"
                />
                <SortableTableHead
                  column="pendingInbounds"
                  label="쿠팡입고예정"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                  align="right"
                />
                <SortableTableHead
                  column="safetyStock"
                  label="안전재고"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                  align="right"
                  tooltip={SAFETY_STOCK_TOOLTIP}
                />
                <SortableTableHead
                  column="growthInboundRecommend"
                  label="쿠팡그로스 입고추천"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                  align="right"
                  tooltip={GROWTH_INBOUND_RECOMMEND_TOOLTIP}
                />
                <SortableTableHead
                  column="actualPackedQty"
                  label="실포장수량"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                  align="right"
                  tooltip={ACTUAL_PACKED_QTY_TOOLTIP}
                />
                <RotationTableHead
                  label="1회전"
                  rank={1}
                  column="rotation1Qty"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                />
                <RotationTableHead
                  label="2회전"
                  rank={2}
                  column="rotation2Qty"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                />
                <RotationTableHead
                  label="3회전"
                  rank={3}
                  column="rotation3Qty"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                />
                <SortableTableHead
                  column="offerCondition"
                  label="등급"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                />
                <SortableTableHead
                  column="daysOfCover"
                  label="소진예상일"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                />
                <SortableTableHead
                  column="location"
                  label="위치"
                  sort={sort}
                  dir={dir}
                  onSort={handleSort}
                  disabled={sortDisabled}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const overrideKey = getInboundWorkbenchOverrideKey(row);
                const isFirstForKey = !editedKeys.has(overrideKey);
                editedKeys.add(overrideKey);
                const draft = drafts?.[overrideKey];
                const safetyHighlighted = isSafetyStockHighlighted(row, draft);
                const growthHighlighted = isGrowthInboundRecommendHighlighted(
                  row,
                  draft,
                );
                const shoplingBelowSafety = isShoplingStockBelowSafetyStock(
                  row.shoplingAvailableStock,
                  row.safetyStock,
                );
                const actualPackedHighlighted = isActualPackedQtyHighlighted(
                  row.actualPackedQty,
                );

                return (
                  <TableRow key={`${row.templateId}|${row.shoplingRowKey}`}>
                    <TableCell className="min-w-[160px]">
                      {formatCell(row.registeredProductName)}
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      {formatCell(row.optionName)}
                    </TableCell>
                    <TableCell>{formatCell(row.productBarcode)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        shoplingBelowSafety && SHOPLING_STOCK_LOW_CLASS,
                      )}
                    >
                      {shoplingBelowSafety ? (
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">
                            {row.shoplingAvailableStock.toLocaleString()}
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm text-left">
                            샵플링 가용재고(
                            {row.shoplingAvailableStock.toLocaleString()})가
                            안전재고({row.safetyStock.toLocaleString()}) 미만입니다.
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        row.shoplingAvailableStock.toLocaleString()
                      )}
                    </TableCell>
                    <TableCell>{formatCell(row.ptnGoodsCd)}</TableCell>
                    <TableCell className="text-right">
                      {row.orderableQuantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.salesQty60days.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.recentSalesQty7days.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.recentSalesQty30days.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.recommendedInboundQty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.pendingInbounds.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        safetyHighlighted && SAFETY_STOCK_HIGHLIGHT_CLASS,
                      )}
                    >
                      <EditableIntegerCell
                        value={row.safetyStock}
                        editable={editMode && isFirstForKey}
                        highlighted={safetyHighlighted}
                        highlightClassName={SAFETY_STOCK_HIGHLIGHT_CLASS}
                        muted={editMode && !isFirstForKey}
                        onChange={(value) =>
                          onDraftChange?.(overrideKey, "safetyStock", value)
                        }
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        growthHighlighted &&
                          GROWTH_INBOUND_RECOMMEND_HIGHLIGHT_CLASS,
                      )}
                    >
                      <EditableIntegerCell
                        value={row.growthInboundRecommend}
                        editable={editMode && isFirstForKey}
                        highlighted={growthHighlighted}
                        highlightClassName={
                          GROWTH_INBOUND_RECOMMEND_HIGHLIGHT_CLASS
                        }
                        muted={editMode && !isFirstForKey}
                        onChange={(value) =>
                          onDraftChange?.(
                            overrideKey,
                            "growthInboundRecommend",
                            value,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        actualPackedHighlighted && SAFETY_STOCK_HIGHLIGHT_CLASS,
                      )}
                    >
                      {row.actualPackedQty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <RotationCell
                        qty={row.rotation1Qty}
                        date={row.rotation1Date}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <RotationCell
                        qty={row.rotation2Qty}
                        date={row.rotation2Date}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <RotationCell
                        qty={row.rotation3Qty}
                        date={row.rotation3Date}
                      />
                    </TableCell>
                    <TableCell>{formatCell(row.offerCondition)}</TableCell>
                    <TableCell>{formatCell(row.daysOfCover)}</TableCell>
                    <TableCell>{formatCell(row.location)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}

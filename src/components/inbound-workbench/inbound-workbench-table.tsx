"use client";

import { EditableIntegerCell } from "@/components/inbound-workbench/editable-integer-cell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
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

const GROWTH_INBOUND_RECOMMEND_TOOLTIP =
  "판매기준수요(max(30일, 7일×3)) − 쿠팡입고예정 − 쿠팡윙재고, 음수면 0, 샵플링 가용재고로 상한. 클릭하여 수정 가능.";

const SAFETY_STOCK_TOOLTIP =
  "안전재고 (수동 입력). 가용재고가 안전재고 미만이면 적색 경고. 클릭하여 수정 가능.";

const SAFETY_STOCK_HIGHLIGHT_CLASS = "bg-yellow-50";
const GROWTH_INBOUND_RECOMMEND_HIGHLIGHT_CLASS = "bg-green-50";

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
}: {
  label: string;
  rank: keyof typeof ROTATION_TOOLTIPS;
}) {
  return (
    <TableHead className="text-right">
      <Tooltip>
        <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-4">
          {label}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm text-left">
          {ROTATION_TOOLTIPS[rank]}
        </TooltipContent>
      </Tooltip>
    </TableHead>
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
  drafts,
  onDraftChange,
}: InboundWorkbenchTableProps) {
  if (rows.length === 0) {
    return null;
  }

  const editedKeys = new Set<string>();

  return (
    <TooltipProvider>
      <div className="overflow-hidden rounded-md border border-border bg-background">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>상품명</TableHead>
                <TableHead>옵션명</TableHead>
                <TableHead>바코드</TableHead>
                <TableHead className="text-right">샵플링재고</TableHead>
                <TableHead>자사상품코드</TableHead>
                <TableHead className="text-right">쿠팡윙재고</TableHead>
                <TableHead className="text-right">60일판매</TableHead>
                <TableHead className="text-right">7일판매</TableHead>
                <TableHead className="text-right">30일판매</TableHead>
                <TableHead className="text-right">쿠팡자체추천</TableHead>
                <TableHead className="text-right">쿠팡입고예정</TableHead>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-4">
                      안전재고
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm text-left">
                      {SAFETY_STOCK_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-4">
                      쿠팡그로스 입고추천
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm text-left">
                      {GROWTH_INBOUND_RECOMMEND_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <RotationTableHead label="1회전" rank={1} />
                <RotationTableHead label="2회전" rank={2} />
                <RotationTableHead label="3회전" rank={3} />
                <TableHead>등급</TableHead>
                <TableHead>소진예상일</TableHead>
                <TableHead>위치</TableHead>
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

                return (
                  <TableRow key={`${row.templateId}|${row.shoplingRowKey}`}>
                    <TableCell className="min-w-[160px]">
                      {formatCell(row.registeredProductName)}
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      {formatCell(row.optionName)}
                    </TableCell>
                    <TableCell>{formatCell(row.productBarcode)}</TableCell>
                    <TableCell className="text-right">
                      {row.shoplingAvailableStock.toLocaleString()}
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

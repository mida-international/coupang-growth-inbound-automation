"use client";

import { Input } from "@/components/ui/input";
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
import type { InboundWorkbenchRowView } from "@/services/inbound-workbench/types";
import { getInboundWorkbenchOverrideKey } from "@/services/inbound-workbench/types";

const GROWTH_INBOUND_RECOMMEND_TOOLTIP =
  "판매기준수요(max(30일, 7일×3)) − 쿠팡입고예정 − 쿠팡윙재고, 음수면 0, 샵플링 가용재고로 상한. 클릭하여 수정 가능.";

function formatCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "-";
  }

  return value;
}

function parseDraftNumber(value: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

type InboundWorkbenchTableProps = {
  rows: InboundWorkbenchRowView[];
  editMode?: boolean;
  onDraftChange?: (
    key: string,
    field: "safetyStock" | "growthInboundRecommend",
    value: number,
  ) => void;
};

export function InboundWorkbenchTable({
  rows,
  editMode = false,
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
                <TableHead className="text-right">안전재고</TableHead>
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
                    <TableCell className="text-right">
                      {editMode && isFirstForKey ? (
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          className="ml-auto h-8 w-24 text-right"
                          value={row.safetyStock}
                          onChange={(event) =>
                            onDraftChange?.(
                              overrideKey,
                              "safetyStock",
                              parseDraftNumber(event.target.value),
                            )
                          }
                        />
                      ) : editMode ? (
                        <span className="text-muted-foreground">
                          {row.safetyStock.toLocaleString()}
                        </span>
                      ) : (
                        row.safetyStock.toLocaleString()
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editMode && isFirstForKey ? (
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          className="ml-auto h-8 w-24 text-right"
                          value={row.growthInboundRecommend}
                          onChange={(event) =>
                            onDraftChange?.(
                              overrideKey,
                              "growthInboundRecommend",
                              parseDraftNumber(event.target.value),
                            )
                          }
                        />
                      ) : editMode ? (
                        <span className="text-muted-foreground">
                          {row.growthInboundRecommend.toLocaleString()}
                        </span>
                      ) : (
                        row.growthInboundRecommend.toLocaleString()
                      )}
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

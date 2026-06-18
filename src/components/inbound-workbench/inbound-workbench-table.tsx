"use client";

import {
  getInboundWorkbenchColumnDef,
  GROWTH_INBOUND_RECOMMEND_HIGHLIGHT_CLASS,
  isActualPackedQtyHighlighted,
  isGrowthInboundRecommendHighlighted,
  isSafetyStockHighlighted,
  isShoplingStockBelowSafetyStock,
  SAFETY_STOCK_HIGHLIGHT_CLASS,
  SHOPLING_STOCK_LOW_CLASS,
  type InboundWorkbenchDraftEntry,
} from "@/components/inbound-workbench/inbound-workbench-columns";
import { LIST_TABLE_HEADER_CLASS } from "@/components/data-list/list-table-header";
import { WorkbenchColumnHead } from "@/components/inbound-workbench/workbench-column-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { InboundWorkbenchSortColumn } from "@/services/inbound-workbench/inbound-workbench-sort";
import type { InboundWorkbenchSortDirection } from "@/services/inbound-workbench/inbound-workbench-sort";
import type { InboundWorkbenchRowView } from "@/services/inbound-workbench/types";
import { getInboundWorkbenchOverrideKey } from "@/services/inbound-workbench/types";

export type { InboundWorkbenchDraftEntry };

const SELLER_COLUMN_WIDTH = 120;

type InboundWorkbenchTableProps = {
  rows: InboundWorkbenchRowView[];
  columnOrder: InboundWorkbenchSortColumn[];
  getColumnWidth: (columnId: InboundWorkbenchSortColumn) => number;
  onReorderColumn: (
    fromId: InboundWorkbenchSortColumn,
    toId: InboundWorkbenchSortColumn,
  ) => void;
  onResizeColumn: (columnId: InboundWorkbenchSortColumn, width: number) => void;
  showSellerColumn?: boolean;
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
  columnOrder,
  getColumnWidth,
  onReorderColumn,
  onResizeColumn,
  showSellerColumn = false,
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
  const layoutDisabled = editMode;

  const handleSort = (column: InboundWorkbenchSortColumn) => {
    if (!sortDisabled) {
      onSort?.(column);
    }
  };

  return (
    <TooltipProvider>
      <Table className="table-fixed" containerClassName="overflow-visible">
        <TableHeader className={LIST_TABLE_HEADER_CLASS}>
              <TableRow className="hover:bg-transparent">
                {showSellerColumn ? (
                  <TableHead
                    className="whitespace-nowrap"
                    style={{
                      width: SELLER_COLUMN_WIDTH,
                      minWidth: SELLER_COLUMN_WIDTH,
                      maxWidth: SELLER_COLUMN_WIDTH,
                    }}
                  >
                    판매자
                  </TableHead>
                ) : null}
                {columnOrder.map((columnId) => {
                  const def = getInboundWorkbenchColumnDef(columnId);
                  const width = getColumnWidth(columnId);

                  return (
                    <WorkbenchColumnHead
                      key={columnId}
                      column={columnId}
                      label={def.label}
                      width={width}
                      sort={sort}
                      dir={dir}
                      onSort={handleSort}
                      onReorder={onReorderColumn}
                      onResize={onResizeColumn}
                      disabled={sortDisabled}
                      layoutDisabled={layoutDisabled}
                      align={def.align}
                      tooltip={def.tooltip}
                    />
                  );
                })}
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

                const cellContext = {
                  editMode,
                  isFirstForKey,
                  overrideKey,
                  draft,
                  safetyHighlighted,
                  growthHighlighted,
                  shoplingBelowSafety,
                  actualPackedHighlighted,
                  onDraftChange,
                };

                return (
                  <TableRow
                    key={`${row.coupangSellerAccountId}|${row.templateId}|${row.shoplingRowKey}`}
                  >
                    {showSellerColumn ? (
                      <TableCell
                        className="overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{
                          width: SELLER_COLUMN_WIDTH,
                          minWidth: SELLER_COLUMN_WIDTH,
                          maxWidth: SELLER_COLUMN_WIDTH,
                        }}
                      >
                        {row.sellerDisplayName}
                      </TableCell>
                    ) : null}
                    {columnOrder.map((columnId) => {
                      const def = getInboundWorkbenchColumnDef(columnId);
                      const width = getColumnWidth(columnId);

                      return (
                        <TableCell
                          key={columnId}
                          className={cn(
                            "overflow-hidden text-ellipsis whitespace-nowrap",
                            def.cellClassName,
                            columnId === "shoplingAvailableStock" &&
                              shoplingBelowSafety &&
                              SHOPLING_STOCK_LOW_CLASS,
                            columnId === "safetyStock" &&
                              safetyHighlighted &&
                              SAFETY_STOCK_HIGHLIGHT_CLASS,
                            columnId === "growthInboundRecommend" &&
                              growthHighlighted &&
                              GROWTH_INBOUND_RECOMMEND_HIGHLIGHT_CLASS,
                            columnId === "actualPackedQty" &&
                              actualPackedHighlighted &&
                              SAFETY_STOCK_HIGHLIGHT_CLASS,
                          )}
                          style={{
                            width,
                            minWidth: width,
                            maxWidth: width,
                          }}
                        >
                          {def.renderCell(row, cellContext)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
    </TooltipProvider>
  );
}

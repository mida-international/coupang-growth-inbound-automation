import {
  INBOUND_WORKBENCH_SORT_COLUMNS,
  type InboundWorkbenchSortColumn,
} from "@/services/inbound-workbench/inbound-workbench-sort";

export const MIN_COLUMN_WIDTH = 64;

export const DEFAULT_COLUMN_ORDER: InboundWorkbenchSortColumn[] = [
  ...INBOUND_WORKBENCH_SORT_COLUMNS,
];

export const DEFAULT_COLUMN_WIDTHS: Record<
  InboundWorkbenchSortColumn,
  number
> = {
  registeredProductName: 160,
  optionName: 120,
  productBarcode: 120,
  shoplingAvailableStock: 96,
  ptnGoodsCd: 120,
  orderableQuantity: 96,
  salesQty60days: 88,
  recentSalesQty7days: 80,
  recentSalesQty30days: 88,
  recommendedInboundQty: 104,
  pendingInbounds: 104,
  safetyStock: 88,
  growthInboundRecommend: 128,
  remainingAfterInbound: 96,
  actualPackedQty: 96,
  rotation1Qty: 80,
  rotation2Qty: 80,
  rotation3Qty: 80,
  offerCondition: 72,
  daysOfCover: 96,
  location: 88,
};

export type InboundWorkbenchColumnLayout = {
  columnOrder: InboundWorkbenchSortColumn[];
  columnWidths: Partial<Record<InboundWorkbenchSortColumn, number>>;
  hiddenColumns: InboundWorkbenchSortColumn[];
};

export function getDefaultColumnLayout(): InboundWorkbenchColumnLayout {
  return {
    columnOrder: [...DEFAULT_COLUMN_ORDER],
    columnWidths: { ...DEFAULT_COLUMN_WIDTHS },
    hiddenColumns: [],
  };
}

function isSortColumn(value: unknown): value is InboundWorkbenchSortColumn {
  return (
    typeof value === "string" &&
    INBOUND_WORKBENCH_SORT_COLUMNS.includes(value as InboundWorkbenchSortColumn)
  );
}

function clampWidth(
  columnId: InboundWorkbenchSortColumn,
  width: unknown,
): number {
  const defaultWidth = DEFAULT_COLUMN_WIDTHS[columnId];
  const parsed = typeof width === "number" ? width : Number(width);

  if (!Number.isFinite(parsed)) {
    return defaultWidth;
  }

  return Math.max(MIN_COLUMN_WIDTH, Math.round(parsed));
}

function normalizeHiddenColumns(
  raw: Partial<InboundWorkbenchColumnLayout> | null | undefined,
  columnOrder: InboundWorkbenchSortColumn[],
): InboundWorkbenchSortColumn[] {
  const seen = new Set<InboundWorkbenchSortColumn>();
  const hiddenColumns: InboundWorkbenchSortColumn[] = [];

  if (Array.isArray(raw?.hiddenColumns)) {
    for (const item of raw.hiddenColumns) {
      if (isSortColumn(item) && !seen.has(item)) {
        seen.add(item);
        hiddenColumns.push(item);
      }
    }
  }

  const visibleCount = columnOrder.filter((id) => !seen.has(id)).length;

  if (visibleCount === 0 && columnOrder.length > 0) {
    return hiddenColumns.filter((id) => id !== columnOrder[0]);
  }

  return hiddenColumns;
}

export function isColumnVisible(
  layout: InboundWorkbenchColumnLayout,
  columnId: InboundWorkbenchSortColumn,
): boolean {
  return !layout.hiddenColumns.includes(columnId);
}

export function getVisibleColumnOrder(
  layout: InboundWorkbenchColumnLayout,
): InboundWorkbenchSortColumn[] {
  const hiddenSet = new Set(layout.hiddenColumns);
  return layout.columnOrder.filter((columnId) => !hiddenSet.has(columnId));
}

export function normalizeColumnLayout(
  raw: Partial<InboundWorkbenchColumnLayout> | null | undefined,
): InboundWorkbenchColumnLayout {
  const defaults = getDefaultColumnLayout();
  const seen = new Set<InboundWorkbenchSortColumn>();
  const columnOrder: InboundWorkbenchSortColumn[] = [];

  if (Array.isArray(raw?.columnOrder)) {
    for (const item of raw.columnOrder) {
      if (isSortColumn(item) && !seen.has(item)) {
        seen.add(item);
        columnOrder.push(item);
      }
    }
  }

  for (const columnId of DEFAULT_COLUMN_ORDER) {
    if (!seen.has(columnId)) {
      columnOrder.push(columnId);
    }
  }

  const columnWidths: Partial<Record<InboundWorkbenchSortColumn, number>> = {
    ...defaults.columnWidths,
  };

  if (raw?.columnWidths && typeof raw.columnWidths === "object") {
    for (const [key, value] of Object.entries(raw.columnWidths)) {
      if (isSortColumn(key)) {
        columnWidths[key] = clampWidth(key, value);
      }
    }
  }

  const hiddenColumns = normalizeHiddenColumns(raw, columnOrder);

  return { columnOrder, columnWidths, hiddenColumns };
}

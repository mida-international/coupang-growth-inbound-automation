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
};

export function getDefaultColumnLayout(): InboundWorkbenchColumnLayout {
  return {
    columnOrder: [...DEFAULT_COLUMN_ORDER],
    columnWidths: { ...DEFAULT_COLUMN_WIDTHS },
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

  return { columnOrder, columnWidths };
}

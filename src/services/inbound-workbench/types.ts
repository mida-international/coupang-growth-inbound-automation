export type InboundWorkbenchSnapshotDates = {
  template: string;
  health: string | null;
  shopling: string | null;
};

export type InboundWorkbenchRowView = {
  templateId: string;
  shoplingRowKey: string;
  optionId: string | null;
  registeredProductName: string | null;
  optionName: string | null;
  productBarcode: string | null;
  shoplingAvailableStock: number;
  ptnGoodsCd: string | null;
  orderableQuantity: number;
  salesQty60days: number;
  recentSalesQty7days: number;
  recentSalesQty30days: number;
  recommendedInboundQty: number;
  pendingInbounds: number;
  offerCondition: string | null;
  daysOfCover: string | null;
  location: string | null;
  safetyStock: number;
  calculatedGrowthInboundRecommend: number;
  growthInboundRecommend: number;
  rotation1Qty: number | null;
  rotation2Qty: number | null;
  rotation3Qty: number | null;
  rotation1Date: string | null;
  rotation2Date: string | null;
  rotation3Date: string | null;
};

export type ListInboundWorkbenchResult = {
  snapshotDates: InboundWorkbenchSnapshotDates | null;
  totalCount: number;
  rows: InboundWorkbenchRowView[];
};

export const EMPTY_INBOUND_WORKBENCH_RESULT: ListInboundWorkbenchResult = {
  snapshotDates: null,
  totalCount: 0,
  rows: [],
};

export const INBOUND_WORKBENCH_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
export const INBOUND_WORKBENCH_DEFAULT_PAGE_SIZE = 50;

export function normalizeInboundWorkbenchPageSize(value?: number): number {
  if (
    value !== undefined &&
    INBOUND_WORKBENCH_PAGE_SIZE_OPTIONS.includes(
      value as (typeof INBOUND_WORKBENCH_PAGE_SIZE_OPTIONS)[number],
    )
  ) {
    return value;
  }

  return INBOUND_WORKBENCH_DEFAULT_PAGE_SIZE;
}

export function getInboundWorkbenchOverrideKey(row: {
  optionId: string | null;
  templateId: string;
}): string {
  return row.optionId ?? `template:${row.templateId}`;
}

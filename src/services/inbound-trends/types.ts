export type InboundTrendsDateValue = {
  coupang: number | null;
  warehouse: number | null;
};

export type InboundTrendsRowView = {
  rowKey: string;
  registeredProductName: string | null;
  optionName: string | null;
  ptnGoodsCd: string | null;
  shoplingOptionValue: string | null;
  productBarcode: string | null;
  dateValues: Record<string, InboundTrendsDateValue>;
};

export type ListInboundTrendsResult = {
  snapshotDates: {
    template: string;
    health: string | null;
    shopling: string | null;
  } | null;
  totalCount: number;
  rows: InboundTrendsRowView[];
  dates: string[];
  dateRange: {
    from: string;
    to: string;
    days: number | null;
  };
};

export const EMPTY_INBOUND_TRENDS_RESULT: ListInboundTrendsResult = {
  snapshotDates: null,
  totalCount: 0,
  rows: [],
  dates: [],
  dateRange: { from: "", to: "", days: null },
};

export const INBOUND_TRENDS_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
export const INBOUND_TRENDS_DEFAULT_PAGE_SIZE = 50;

export function normalizeInboundTrendsPageSize(value?: number): number {
  if (
    value !== undefined &&
    INBOUND_TRENDS_PAGE_SIZE_OPTIONS.includes(
      value as (typeof INBOUND_TRENDS_PAGE_SIZE_OPTIONS)[number],
    )
  ) {
    return value;
  }

  return INBOUND_TRENDS_DEFAULT_PAGE_SIZE;
}

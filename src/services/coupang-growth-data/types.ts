import {
  INBOUND_WORKBENCH_DEFAULT_PAGE_SIZE,
  INBOUND_WORKBENCH_PAGE_SIZE_OPTIONS,
  normalizeInboundWorkbenchPageSize,
} from "@/services/inbound-workbench/types";

export type InventoryHealthRowView = {
  sellerDisplayName: string;
  optionId: string | null;
  registeredProductName: string | null;
  optionName: string | null;
  productBarcode: string | null;
  ptnGoodsCd: string | null;
  orderableQuantity: number;
  pendingInbounds: number;
  recentSalesQty7days: number;
  recentSalesQty30days: number;
  recommendedInboundQty: number;
  offerCondition: string | null;
  daysOfCover: string | null;
  healthSnapshotDate: string;
};

export type ListInventoryHealthResult = {
  snapshotDate: string | null;
  isAllSellers: boolean;
  hasHealthData: boolean;
  totalCount: number;
  rows: InventoryHealthRowView[];
};

export const EMPTY_INVENTORY_HEALTH_RESULT: ListInventoryHealthResult = {
  snapshotDate: null,
  isAllSellers: false,
  hasHealthData: false,
  totalCount: 0,
  rows: [],
};

export const INVENTORY_HEALTH_PAGE_SIZE_OPTIONS =
  INBOUND_WORKBENCH_PAGE_SIZE_OPTIONS;
export const INVENTORY_HEALTH_DEFAULT_PAGE_SIZE =
  INBOUND_WORKBENCH_DEFAULT_PAGE_SIZE;

export function normalizeInventoryHealthPageSize(value?: number): number {
  return normalizeInboundWorkbenchPageSize(value);
}

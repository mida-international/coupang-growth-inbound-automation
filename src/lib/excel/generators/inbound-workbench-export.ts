import {
  generateSimpleListBuffer,
  type SimpleListColumn,
} from "@/lib/excel/generators/simple-list-export";
import { DEFAULT_COLUMN_ORDER } from "@/services/inbound-workbench/inbound-workbench-column-layout";
import type { InboundWorkbenchSortColumn } from "@/services/inbound-workbench/inbound-workbench-sort";
import type { InboundWorkbenchRowView } from "@/services/inbound-workbench/types";

const WORKBENCH_COLUMN_LABELS: Record<InboundWorkbenchSortColumn, string> = {
  registeredProductName: "상품명",
  optionName: "옵션명",
  productBarcode: "바코드",
  shoplingAvailableStock: "샵플링재고",
  ptnGoodsCd: "자사상품코드",
  orderableQuantity: "쿠팡윙재고",
  salesQty60days: "60일판매",
  recentSalesQty7days: "7일판매",
  recentSalesQty30days: "30일판매",
  recommendedInboundQty: "쿠팡자체추천",
  pendingInbounds: "쿠팡입고예정",
  safetyStock: "안전재고",
  growthInboundRecommend: "쿠팡그로스 입고추천",
  remainingAfterInbound: "입고후 잔여",
  actualPackedQty: "실포장수량",
  rotation1Qty: "1회전",
  rotation2Qty: "2회전",
  rotation3Qty: "3회전",
  offerCondition: "등급",
  daysOfCover: "소진예상일",
  location: "위치",
};

function formatCell(value: string | null | undefined): string {
  return value?.trim() ? value : "";
}

function formatRotationQty(qty: number | null): string | number {
  if (qty === null) {
    return "";
  }

  return qty;
}

function buildWorkbenchRowValues(
  row: InboundWorkbenchRowView,
): Record<string, string | number> {
  return {
    sellerDisplayName: row.sellerDisplayName,
    registeredProductName: formatCell(row.registeredProductName),
    optionName: formatCell(row.optionName),
    productBarcode: formatCell(row.productBarcode),
    shoplingAvailableStock: row.shoplingAvailableStock,
    ptnGoodsCd: formatCell(row.ptnGoodsCd),
    orderableQuantity: row.orderableQuantity,
    salesQty60days: row.salesQty60days,
    recentSalesQty7days: row.recentSalesQty7days,
    recentSalesQty30days: row.recentSalesQty30days,
    recommendedInboundQty: row.recommendedInboundQty,
    pendingInbounds: row.pendingInbounds,
    safetyStock: row.safetyStock,
    growthInboundRecommend: row.growthInboundRecommend,
    remainingAfterInbound: Math.max(
      0,
      row.shoplingAvailableStock - row.growthInboundRecommend,
    ),
    actualPackedQty: row.actualPackedQty,
    rotation1Qty: formatRotationQty(row.rotation1Qty),
    rotation2Qty: formatRotationQty(row.rotation2Qty),
    rotation3Qty: formatRotationQty(row.rotation3Qty),
    offerCondition: formatCell(row.offerCondition),
    daysOfCover: formatCell(row.daysOfCover),
    location: formatCell(row.location),
  };
}

function buildWorkbenchColumns(
  includeSellerColumn: boolean,
): SimpleListColumn[] {
  const columns: SimpleListColumn[] = [];

  if (includeSellerColumn) {
    columns.push({ key: "sellerDisplayName", header: "판매자" });
  }

  for (const columnId of DEFAULT_COLUMN_ORDER) {
    columns.push({
      key: columnId,
      header: WORKBENCH_COLUMN_LABELS[columnId],
    });
  }

  return columns;
}

export function buildInboundWorkbenchFilename(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `대시보드_입고현황_${today}.xlsx`;
}

export function generateInboundWorkbenchBuffer(
  rows: InboundWorkbenchRowView[],
  options?: { includeSellerColumn?: boolean },
): Buffer {
  const includeSellerColumn = options?.includeSellerColumn ?? false;
  const columns = buildWorkbenchColumns(includeSellerColumn);

  return generateSimpleListBuffer({
    sheetName: "입고현황",
    columns,
    rows: rows.map((row) => buildWorkbenchRowValues(row)),
  });
}

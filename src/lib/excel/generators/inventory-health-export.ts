import {
  generateSimpleListBuffer,
  type SimpleListColumn,
} from "@/lib/excel/generators/simple-list-export";
import type { InventoryHealthRowView } from "@/services/coupang-growth-data/types";

const COLUMNS: SimpleListColumn[] = [
  { key: "sellerDisplayName", header: "판매자 계정" },
  { key: "registeredProductName", header: "등록상품명" },
  { key: "optionName", header: "옵션명" },
  { key: "optionId", header: "옵션 ID" },
  { key: "productBarcode", header: "바코드" },
  { key: "ptnGoodsCd", header: "샵플링 자사상품코드" },
  { key: "orderableQuantity", header: "주문가능재고" },
  { key: "pendingInbounds", header: "입고예정" },
  { key: "recentSalesQty7days", header: "7일 판매수량" },
  { key: "recentSalesQty30days", header: "30일 판매수량" },
  { key: "recommendedInboundQty", header: "추천입고수량" },
  { key: "offerCondition", header: "Offer condition" },
  { key: "daysOfCover", header: "Days of cover" },
  { key: "healthSnapshotDate", header: "재고 스냅샷일" },
];

function formatCell(value: string | null | undefined): string {
  return value?.trim() ? value : "";
}

export function buildInventoryHealthFilename(): string {
  return `재고현황_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

export function generateInventoryHealthBuffer(
  rows: InventoryHealthRowView[],
): Buffer {
  return generateSimpleListBuffer({
    sheetName: "재고현황",
    columns: COLUMNS,
    rows: rows.map((row) => ({
      sellerDisplayName: row.sellerDisplayName,
      registeredProductName: formatCell(row.registeredProductName),
      optionName: formatCell(row.optionName),
      optionId: formatCell(row.optionId),
      productBarcode: formatCell(row.productBarcode),
      ptnGoodsCd: formatCell(row.ptnGoodsCd),
      orderableQuantity: row.orderableQuantity,
      pendingInbounds: row.pendingInbounds,
      recentSalesQty7days: row.recentSalesQty7days,
      recentSalesQty30days: row.recentSalesQty30days,
      recommendedInboundQty: row.recommendedInboundQty,
      offerCondition: formatCell(row.offerCondition),
      daysOfCover: formatCell(row.daysOfCover),
      healthSnapshotDate: row.healthSnapshotDate,
    })),
  });
}

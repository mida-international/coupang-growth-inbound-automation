import type { ExcelIngestionTarget } from "@/lib/excel/types";

/** Columns B–AA: 등록상품 ID ~ 상품등록일 (A열 No. 제외) */
export const inventoryHealthColumnMap = [
  { field: "inventoryId", headerIncludes: "등록상품 ID" },
  { field: "optionId", headerIncludes: "옵션 ID" },
  { field: "skuId", headerIncludes: "SKU ID" },
  { field: "productName", headerIncludes: "등록상품명" },
  { field: "optionName", headerIncludes: "옵션명" },
  { field: "offerCondition", headerIncludes: "상품등급" },
  { field: "orderableQuantity", headerIncludes: "판매가능재고" },
  { field: "pendingInbounds", headerIncludes: "입고예정재고" },
  { field: "itemWinner", headerIncludes: "아이템위너" },
  {
    field: "recentSales7days",
    headerIncludes: "최근 매출",
    headerAlsoIncludes: "7일",
  },
  {
    field: "recentSales30days",
    headerIncludes: "최근 매출",
    headerAlsoIncludes: "30일",
  },
  {
    field: "recentSalesQty7days",
    headerIncludes: "최근 판매수량",
    headerAlsoIncludes: "7일",
  },
  {
    field: "recentSalesQty30days",
    headerIncludes: "최근 판매수량",
    headerAlsoIncludes: "30일",
  },
  {
    field: "recommendedInboundQty",
    headerIncludes: "추가입고",
    headerAlsoIncludes: "추천수량",
  },
  { field: "recommendedInboundDate", headerIncludes: "추가입고날짜" },
  { field: "daysOfCover", headerIncludes: "재고예상", headerAlsoIncludes: "소진일" },
  { field: "monthlyStorageFee", headerIncludes: "누적보관료" },
  {
    field: "skuAge1_30",
    headerIncludes: "보관기간별",
    headerAlsoIncludes: "1~30",
  },
  {
    field: "skuAge31_45",
    headerIncludes: "보관기간별",
    headerAlsoIncludes: "31~45",
  },
  {
    field: "skuAge46_60",
    headerIncludes: "보관기간별",
    headerAlsoIncludes: "46~60",
  },
  {
    field: "skuAge61_120",
    headerIncludes: "보관기간별",
    headerAlsoIncludes: "61~120",
  },
  {
    field: "skuAge121_180",
    headerIncludes: "보관기간별",
    headerAlsoIncludes: "121~180",
  },
  {
    field: "skuAge181Plus",
    headerIncludes: "보관기간별",
    headerAlsoIncludes: "181",
  },
  {
    field: "customerReturns30days",
    headerIncludes: "고객반품",
    headerAlsoIncludes: "30일",
  },
  { field: "season", headerIncludes: "시즌관리" },
  { field: "productListingDate", headerIncludes: "상품등록일" },
] as const;

export type InventoryHealthField =
  (typeof inventoryHealthColumnMap)[number]["field"];

export const coupangGrowthInventoryHealthTarget: ExcelIngestionTarget = {
  id: "coupang_growth_inventory_health",
  tableName: "coupang_growth_inventory_health",
  label: "재고 현황",
  requiredHeaderKeywords: [
    "등록상품 ID",
    "옵션 ID",
    "SKU ID",
    "판매가능재고",
    "보관기간별",
  ],
};

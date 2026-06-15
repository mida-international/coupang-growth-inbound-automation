import type { HeaderMatcher } from "@/lib/excel/match-header-keywords";
import type { ExcelIngestionTarget } from "@/lib/excel/types";

export type InventoryHealthColumnMapEntry = {
  field: string;
  matchers: readonly HeaderMatcher[];
};

/** Columns B–AA: 등록상품 ID ~ 상품등록일 (A열 No. 제외) */
export const inventoryHealthColumnMap = [
  {
    field: "inventoryId",
    matchers: [
      { headerIncludes: "등록상품 ID" },
      { headerIncludes: "Inventory ID" },
    ],
  },
  {
    field: "optionId",
    matchers: [{ headerIncludes: "옵션 ID" }, { headerIncludes: "Option ID" }],
  },
  {
    field: "skuId",
    matchers: [{ headerIncludes: "SKU ID" }],
  },
  {
    field: "productName",
    matchers: [
      { headerIncludes: "등록상품명" },
      { headerIncludes: "Product name" },
    ],
  },
  {
    field: "optionName",
    matchers: [{ headerIncludes: "옵션명" }, { headerIncludes: "Option name" }],
  },
  {
    field: "offerCondition",
    matchers: [
      { headerIncludes: "상품등급" },
      { headerIncludes: "Offer condition" },
    ],
  },
  {
    field: "orderableQuantity",
    matchers: [
      { headerIncludes: "판매가능재고" },
      { headerIncludes: "Orderable quantity" },
    ],
  },
  {
    field: "pendingInbounds",
    matchers: [
      { headerIncludes: "입고예정재고" },
      { headerIncludes: "Pending inbounds" },
    ],
  },
  {
    field: "itemWinner",
    matchers: [
      { headerIncludes: "아이템위너" },
      { headerIncludes: "Item winner" },
    ],
  },
  {
    field: "recentSales7days",
    matchers: [
      { headerIncludes: "최근 매출", headerAlsoIncludes: "7일" },
      { headerIncludes: "Recent sales", headerAlsoIncludes: "Last 7 days" },
    ],
  },
  {
    field: "recentSales30days",
    matchers: [
      { headerIncludes: "최근 매출", headerAlsoIncludes: "30일" },
      { headerIncludes: "Recent sales", headerAlsoIncludes: "Last 30 days" },
    ],
  },
  {
    field: "recentSalesQty7days",
    matchers: [
      { headerIncludes: "최근 판매수량", headerAlsoIncludes: "7일" },
      {
        headerIncludes: "Recent sales quantity",
        headerAlsoIncludes: "Last 7 days",
      },
    ],
  },
  {
    field: "recentSalesQty30days",
    matchers: [
      { headerIncludes: "최근 판매수량", headerAlsoIncludes: "30일" },
      {
        headerIncludes: "Recent sales quantity",
        headerAlsoIncludes: "Last 30 days",
      },
    ],
  },
  {
    field: "recommendedInboundQty",
    matchers: [
      { headerIncludes: "추가입고", headerAlsoIncludes: "추천수량" },
      { headerIncludes: "Recommended inbound", headerAlsoIncludes: "quantity" },
    ],
  },
  {
    field: "recommendedInboundDate",
    matchers: [
      { headerIncludes: "추가입고날짜" },
      { headerIncludes: "Recommended inbound date" },
    ],
  },
  {
    field: "daysOfCover",
    matchers: [
      { headerIncludes: "재고예상", headerAlsoIncludes: "소진일" },
      { headerIncludes: "Days of cover" },
    ],
  },
  {
    field: "monthlyStorageFee",
    matchers: [
      { headerIncludes: "누적보관료" },
      { headerIncludes: "Monthly storage fee" },
    ],
  },
  {
    field: "skuAge1_30",
    matchers: [
      { headerIncludes: "보관기간별", headerAlsoIncludes: "1~30" },
      { headerIncludes: "Sku age", headerAlsoIncludes: "1~30" },
    ],
  },
  {
    field: "skuAge31_45",
    matchers: [
      { headerIncludes: "보관기간별", headerAlsoIncludes: "31~45" },
      { headerIncludes: "Sku age", headerAlsoIncludes: "31~45" },
    ],
  },
  {
    field: "skuAge46_60",
    matchers: [
      { headerIncludes: "보관기간별", headerAlsoIncludes: "46~60" },
      { headerIncludes: "Sku age", headerAlsoIncludes: "46~60" },
    ],
  },
  {
    field: "skuAge61_120",
    matchers: [
      { headerIncludes: "보관기간별", headerAlsoIncludes: "61~120" },
      { headerIncludes: "Sku age", headerAlsoIncludes: "61~120" },
    ],
  },
  {
    field: "skuAge121_180",
    matchers: [
      { headerIncludes: "보관기간별", headerAlsoIncludes: "121~180" },
      { headerIncludes: "Sku age", headerAlsoIncludes: "121~180" },
    ],
  },
  {
    field: "skuAge181Plus",
    matchers: [
      { headerIncludes: "보관기간별", headerAlsoIncludes: "181" },
      { headerIncludes: "Sku age", headerAlsoIncludes: "181" },
    ],
  },
  {
    field: "customerReturns30days",
    matchers: [
      { headerIncludes: "고객반품", headerAlsoIncludes: "30일" },
      { headerIncludes: "Customer returns", headerAlsoIncludes: "30 days" },
    ],
  },
  {
    field: "season",
    matchers: [{ headerIncludes: "시즌관리" }, { headerIncludes: "Season" }],
  },
  {
    field: "productListingDate",
    matchers: [
      { headerIncludes: "상품등록일" },
      { headerIncludes: "Product listing date" },
    ],
  },
] as const satisfies readonly InventoryHealthColumnMapEntry[];

export type InventoryHealthField =
  (typeof inventoryHealthColumnMap)[number]["field"];

export const coupangGrowthInventoryHealthTarget: ExcelIngestionTarget = {
  id: "coupang_growth_inventory_health",
  tableName: "coupang_growth_inventory_health",
  label: "재고 현황",
  requiredHeaderKeywordSets: [
    ["등록상품 ID", "옵션 ID", "SKU ID", "판매가능재고", "보관기간별"],
    ["Inventory ID", "Option ID", "SKU ID", "Orderable quantity", "Sku age"],
  ],
};

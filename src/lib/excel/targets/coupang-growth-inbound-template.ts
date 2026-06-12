import type { ExcelIngestionTarget } from "@/lib/excel/types";

/** Columns B–AM: 등록상품명 ~ Req prod year (V 입고 수량 입력 제외) */
export const inboundTemplateColumnMap = [
  { field: "registeredProductName", headerIncludes: "등록상품명" },
  { field: "optionName", headerIncludes: "옵션명" },
  { field: "sellingPrice", headerIncludes: "판매가" },
  { field: "exposedProductId", headerIncludes: "노출상품 ID" },
  { field: "registeredProductId", headerIncludes: "등록상품 ID" },
  { field: "optionId", headerIncludes: "옵션 ID" },
  { field: "sellingMethod", headerIncludes: "판매 방식" },
  { field: "sales2025Total", headerIncludes: "25년 총계" },
  { field: "sales2026Total", headerIncludes: "26년 총계" },
  { field: "sales2026_03", headerIncludes: "26년 03월" },
  { field: "sales2026_04", headerIncludes: "26년 04월" },
  { field: "sales2026_05", headerIncludes: "26년 05월" },
  { field: "salesLast14days", headerIncludes: "지난 14일" },
  { field: "qtySold2weeks", headerIncludes: "2주간", headerAlsoIncludes: "판매수량" },
  { field: "qtySold1week", headerIncludes: "1주간", headerAlsoIncludes: "판매수량" },
  { field: "sellerFeeRate", headerIncludes: "판매자", headerAlsoIncludes: "수수료율" },
  { field: "sellerFee", headerIncludes: "판매자", headerAlsoIncludes: "수수료", excludeIncludes: "수수료율" },
  { field: "cfsEstimatedFee", headerIncludes: "쿠팡풀필먼트서비스" },
  { field: "baseDiscount", headerIncludes: "기본 할인액" },
  { field: "discountedEstimatedFee", headerIncludes: "할인 적용 예상 요금" },
  { field: "estSales2weeksByQty", headerIncludes: "입고수량에 따른 2주간 예상 매출" },
  { field: "shelfLifeDaysInput", headerIncludes: "유통기간 입력" },
  { field: "expiryDate", headerIncludes: "유통(소비)기한" },
  { field: "manufactureDate", headerIncludes: "제조일자" },
  { field: "productionYear", headerIncludes: "생산연도" },
  { field: "productBarcode", headerIncludes: "상품바코드" },
  { field: "productSize", headerIncludes: "상품 사이즈" },
  { field: "handleWithCare", headerIncludes: "취급주의여부" },
  { field: "availableStock", headerIncludes: "판매가능재고" },
  { field: "estStockoutDate", headerIncludes: "예상 재고 소진일" },
  { field: "category", headerIncludes: "카테고리" },
  { field: "parallelImport", headerIncludes: "병행수입 여부" },
  { field: "taxType", headerIncludes: "과세유형" },
  { field: "skuId", headerIncludes: "SKU ID" },
  { field: "reqExpDate", headerIncludes: "Req exp date" },
  { field: "reqManDate", headerIncludes: "Req man date" },
  { field: "reqProdYear", headerIncludes: "Req prod year" },
] as const;

export type InboundTemplateField =
  (typeof inboundTemplateColumnMap)[number]["field"];

export const coupangGrowthInboundTemplateTarget: ExcelIngestionTarget = {
  id: "coupang_growth_inbound_template",
  tableName: "coupang_growth_inbound_template",
  label: "입고 생성 템플릿",
  requiredHeaderKeywords: [
    "등록상품명",
    "옵션 ID",
    "노출상품 ID",
    "등록상품 ID",
    "판매가",
  ],
};

import type { ExcelIngestionTarget } from "@/lib/excel/types";

/** Columns B–AM: 등록상품명 ~ Req prod year */
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
  filenamePatterns: [
    /inbound/i,
    /입고/i,
    /template/i,
    /템플릿/i,
    /전체.*등록/i,
  ],
};

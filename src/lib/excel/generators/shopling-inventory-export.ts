import {
  generateSimpleListBuffer,
  type SimpleListColumn,
} from "@/lib/excel/generators/simple-list-export";
import type { ShoplingInventoryRowView } from "@/services/shopling-data/types";

const COLUMNS: SimpleListColumn[] = [
  { key: "goodsKey", header: "샵플링코드" },
  { key: "ptnGoodsCd", header: "자사상품코드" },
  { key: "saleStatus", header: "판매상태" },
  { key: "goodsTp", header: "상품 구분" },
  { key: "barcode", header: "바코드" },
  { key: "optionTitle", header: "옵션명" },
  { key: "optionValue", header: "옵션값" },
  { key: "availableStock", header: "현재고" },
  { key: "optStatus", header: "옵션 판매상태" },
  { key: "location", header: "창고" },
];

function formatCell(value: string | null | undefined): string {
  return value?.trim() ? value : "";
}

function formatOptStatus(code: string | null): string {
  if (!code) {
    return "";
  }

  switch (code.toUpperCase()) {
    case "B":
      return "판매";
    case "C":
      return "품절";
    case "X":
      return "미사용";
    default:
      return code;
  }
}

export function buildShoplingInventoryFilename(snapshotDate: string | null): string {
  const suffix = snapshotDate ?? new Date().toISOString().slice(0, 10);
  return `샵플링_상품정보_${suffix}.xlsx`;
}

export function generateShoplingInventoryBuffer(
  rows: ShoplingInventoryRowView[],
): Buffer {
  return generateSimpleListBuffer({
    sheetName: "상품정보",
    columns: COLUMNS,
    rows: rows.map((row) => ({
      goodsKey: row.goodsKey,
      ptnGoodsCd: formatCell(row.ptnGoodsCd),
      saleStatus: formatCell(row.saleStatus),
      goodsTp: formatCell(row.goodsTp),
      barcode: formatCell(row.barcode),
      optionTitle: formatCell(row.optionTitle),
      optionValue: formatCell(row.optionValue),
      availableStock: row.availableStock,
      optStatus: formatOptStatus(row.optStatus),
      location: formatCell(row.location),
    })),
  });
}

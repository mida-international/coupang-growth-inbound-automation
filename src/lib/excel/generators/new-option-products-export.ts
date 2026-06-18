import {
  generateSimpleListBuffer,
  type SimpleListColumn,
} from "@/lib/excel/generators/simple-list-export";
import type { ShoplingNewOptionProductRowView } from "@/services/shopling-data/types";

const COLUMNS: SimpleListColumn[] = [
  { key: "goodsKey", header: "샵플링코드" },
  { key: "optId", header: "옵션코드" },
  { key: "ptnGoodsCd", header: "자사상품코드" },
  { key: "optionValue", header: "옵션" },
  { key: "barcode", header: "바코드" },
  { key: "firstAddedDate", header: "추가일" },
];

function formatCell(value: string | null | undefined): string {
  return value?.trim() ? value : "";
}

export function buildNewOptionProductsFilename(from: string, to: string): string {
  return `신규옵션상품_${from}_${to}.xlsx`;
}

export function generateNewOptionProductsBuffer(
  rows: ShoplingNewOptionProductRowView[],
): Buffer {
  return generateSimpleListBuffer({
    sheetName: "신규옵션상품",
    columns: COLUMNS,
    rows: rows.map((row) => ({
      goodsKey: row.goodsKey,
      optId: row.optId,
      ptnGoodsCd: formatCell(row.ptnGoodsCd),
      optionValue: formatCell(row.optionValue),
      barcode: row.barcode,
      firstAddedDate: row.firstAddedDate,
    })),
  });
}

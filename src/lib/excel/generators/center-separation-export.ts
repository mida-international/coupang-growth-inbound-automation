import {
  generateSimpleListBuffer,
  type SimpleListColumn,
} from "@/lib/excel/generators/simple-list-export";
import type { CenterSeparationRowView } from "@/services/center-separation/types";

const COLUMNS: SimpleListColumn[] = [
  { key: "registeredProductName", header: "쿠팡그로스 상품이름" },
  { key: "optionName", header: "옵션명" },
  { key: "ptnGoodsCd", header: "자사상품코드" },
  { key: "shoplingOptionValue", header: "샵플링 옵션 벨류" },
  { key: "barcode", header: "바코드" },
];

function formatCell(value: string | null | undefined): string {
  return value?.trim() ? value : "";
}

export function buildCenterSeparationFilename(): string {
  return `센터분리_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

export function generateCenterSeparationBuffer(
  rows: CenterSeparationRowView[],
): Buffer {
  return generateSimpleListBuffer({
    sheetName: "센터분리",
    columns: COLUMNS,
    rows: rows.map((row) => ({
      registeredProductName: formatCell(row.registeredProductName),
      optionName: formatCell(row.optionName),
      ptnGoodsCd: formatCell(row.ptnGoodsCd),
      shoplingOptionValue: formatCell(row.shoplingOptionValue),
      barcode: formatCell(row.barcode),
    })),
  });
}

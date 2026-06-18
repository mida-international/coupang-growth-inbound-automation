import {
  generateSimpleListBuffer,
  type SimpleListColumn,
} from "@/lib/excel/generators/simple-list-export";
import type { ShoplingPackageMappingRowView } from "@/services/shopling-package-mapping/types";

const COLUMNS: SimpleListColumn[] = [
  { key: "packageBarcode", header: "패키지 바코드" },
  { key: "packageGoodsKey", header: "패키지 샵플링코드" },
  { key: "packagePtnGoodsCd", header: "패키지 자사코드" },
  { key: "packageOptId", header: "패키지 옵션ID" },
  { key: "packageOptValue", header: "패키지 옵션값" },
  { key: "singleBarcode", header: "단품 바코드" },
  { key: "singleGoodsKey", header: "단품 샵플링코드" },
  { key: "singlePtnGoodsCd", header: "단품 자사코드" },
  { key: "singleOptId", header: "단품 옵션ID" },
  { key: "singleOptValue", header: "단품 옵션값" },
  { key: "mapCnt", header: "구성수량" },
  { key: "manuallyEdited", header: "수동편집" },
];

function formatCell(value: string | null | undefined): string {
  return value?.trim() ? value : "";
}

export function buildShoplingPackageMappingFilename(): string {
  return `패키지매핑_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

export function generateShoplingPackageMappingBuffer(
  rows: ShoplingPackageMappingRowView[],
): Buffer {
  return generateSimpleListBuffer({
    sheetName: "패키지매핑",
    columns: COLUMNS,
    rows: rows.map((row) => ({
      packageBarcode: formatCell(row.packageBarcode),
      packageGoodsKey: row.packageGoodsKey,
      packagePtnGoodsCd: formatCell(row.packagePtnGoodsCd),
      packageOptId: row.packageOptId,
      packageOptValue: formatCell(row.packageOptValue),
      singleBarcode: formatCell(row.singleBarcode),
      singleGoodsKey: row.singleGoodsKey,
      singlePtnGoodsCd: formatCell(row.singlePtnGoodsCd),
      singleOptId: row.singleOptId,
      singleOptValue: formatCell(row.singleOptValue),
      mapCnt: row.mapCnt,
      manuallyEdited: row.manuallyEdited ? "수동" : "",
    })),
  });
}

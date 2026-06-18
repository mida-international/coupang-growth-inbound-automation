import {
  generateMultiSheetListBuffer,
  type SimpleListColumn,
} from "@/lib/excel/generators/simple-list-export";
import type { ShoplingInboundDeliverableListItem } from "@/services/deliverables/types";

const HISTORY_COLUMNS: SimpleListColumn[] = [
  { key: "recordedAt", header: "생성일시" },
  { key: "outputFileName", header: "산출물 파일명" },
  { key: "sourceFileName", header: "원본 파일명" },
  { key: "recordedByName", header: "기록자" },
  { key: "barcodeCount", header: "바코드 수" },
  { key: "totalQuantity", header: "수량 합" },
];

const DETAIL_COLUMNS: SimpleListColumn[] = [
  { key: "outputFileName", header: "산출물 파일명" },
  { key: "barcode", header: "바코드" },
  { key: "quantity", header: "수량" },
];

function formatCell(value: string | null | undefined): string {
  return value?.trim() ? value : "";
}

function formatRecordedAt(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function buildShoplingInboundHistoryFilename(): string {
  return `샵플링_입고이력_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

export function generateShoplingInboundHistoryBuffer(
  rows: ShoplingInboundDeliverableListItem[],
): Buffer {
  const detailRows = rows.flatMap((row) =>
    row.items.map((item) => ({
      outputFileName: row.outputFileName,
      barcode: item.barcode,
      quantity: item.quantity,
    })),
  );

  return generateMultiSheetListBuffer([
    {
      sheetName: "이력",
      columns: HISTORY_COLUMNS,
      rows: rows.map((row) => ({
        recordedAt: formatRecordedAt(row.recordedAt),
        outputFileName: row.outputFileName,
        sourceFileName: formatCell(row.sourceFileName),
        recordedByName: formatCell(row.recordedByName),
        barcodeCount: row.barcodeCount,
        totalQuantity: row.totalQuantity,
      })),
    },
    {
      sheetName: "상세",
      columns: DETAIL_COLUMNS,
      rows: detailRows,
    },
  ]);
}

import {
  generateMultiSheetListBuffer,
  type SimpleListColumn,
} from "@/lib/excel/generators/simple-list-export";
import type { WarehouseInboundDeliverableListItem } from "@/services/deliverables/types";

const HISTORY_COLUMNS: SimpleListColumn[] = [
  { key: "recordedAt", header: "기록일시" },
  { key: "outputFileName", header: "산출물 파일명" },
  { key: "sellerDisplayName", header: "판매자" },
  { key: "recordDate", header: "기록일" },
  { key: "rotationCount", header: "입고 회차" },
  { key: "recordedByName", header: "기록자" },
  { key: "itemCount", header: "행 수" },
  { key: "totalQuantity", header: "수량 합" },
];

const DETAIL_COLUMNS: SimpleListColumn[] = [
  { key: "outputFileName", header: "산출물 파일명" },
  { key: "recordDate", header: "일자" },
  { key: "location", header: "로케이션" },
  { key: "registeredProductName", header: "등록상품명" },
  { key: "optionName", header: "옵션명" },
  { key: "productBarcode", header: "바코드" },
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

function formatRotationLabel(rotationCount: number): string {
  if (rotationCount <= 0) {
    return "없음";
  }

  return `${rotationCount}회전`;
}

export function buildWarehouseInboundHistoryFilename(): string {
  return `창고전송_입고이력_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

export function generateWarehouseInboundHistoryBuffer(
  rows: WarehouseInboundDeliverableListItem[],
): Buffer {
  const detailRows = rows.flatMap((row) =>
    row.items.map((item) => ({
      outputFileName: row.outputFileName,
      recordDate: item.recordDate,
      location: formatCell(item.location),
      registeredProductName: formatCell(item.registeredProductName),
      optionName: formatCell(item.optionName),
      productBarcode: formatCell(item.productBarcode),
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
        sellerDisplayName: row.sellerDisplayName,
        recordDate: row.recordDate,
        rotationCount: formatRotationLabel(row.rotationCount),
        recordedByName: formatCell(row.recordedByName),
        itemCount: row.itemCount,
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

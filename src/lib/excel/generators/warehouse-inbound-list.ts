import * as XLSX from "xlsx";

import { getKstTodayDate } from "@/lib/date/kst-today";
import { resolveWarehouseInboundRotationQuantity } from "@/lib/deliverables/resolve-warehouse-inbound-rotation-quantity";
import type { OutboundPackageComponent } from "@/lib/deliverables/decompose-outbound-deduct-rows";
import type { ShoplingInboundRotationBatch } from "@/services/deliverables/load-shopling-inbound-rotation-batches";
import type { WarehouseInboundListRow } from "@/services/deliverables/types";

export type GenerateWarehouseInboundListOptions = {
  rotationCount?: 0 | 1 | 2 | 3;
  rotationBatches?: ShoplingInboundRotationBatch[];
  packageMappingsByBarcode?: Map<string, OutboundPackageComponent[]>;
};

const BASE_COLUMN_KEYS = [
  "box",
  "date",
  "location",
  "등록상품명",
  "옵션명",
  "바코드",
  "수량",
] as const;

const MIN_COLUMN_WIDTHS = [6, 12, 10, 30, 25, 18, 8];
const ROTATION_COLUMN_MIN_WIDTH = 8;

function getRotationColumnKeys(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${index + 1}회차`);
}

function formatKstIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getKstSheetName(date: Date): string {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  return `${month}.${day}요청`;
}

function getDisplayWidth(value: string): number {
  let width = 0;

  for (const character of value) {
    width += character.charCodeAt(0) > 0x7f ? 2 : 1;
  }

  return width;
}

function toOutputRows(
  rows: WarehouseInboundListRow[],
  today: string,
  options?: GenerateWarehouseInboundListOptions,
): Record<string, string | number>[] {
  const rotationCount = options?.rotationCount ?? 0;
  const rotationHeaders = getRotationColumnKeys(rotationCount);
  const rotationBatches = options?.rotationBatches ?? [];
  const packageMappingsByBarcode =
    options?.packageMappingsByBarcode ?? new Map<string, OutboundPackageComponent[]>();

  const output: Record<string, string | number>[] = [];
  let boxNum = 1;

  for (let index = 0; index < rows.length; index++) {
    if (index > 0 && index % 50 === 0) {
      boxNum++;
    }

    const row = rows[index];
    const outputRow: Record<string, string | number> = {
      box: String(boxNum),
      date: today,
      location: row.location ?? "",
      등록상품명: row.registeredProductName ?? "",
      옵션명: row.optionName ?? "",
      바코드: row.productBarcode ?? "",
      수량: row.growthInboundRecommend,
    };

    for (let rotationIndex = 0; rotationIndex < rotationHeaders.length; rotationIndex++) {
      const header = rotationHeaders[rotationIndex]!;
      const batch = rotationBatches[rotationIndex];

      if (!batch) {
        outputRow[header] = "";
        continue;
      }

      const quantity = resolveWarehouseInboundRotationQuantity(
        row.productBarcode,
        batch.qtyByBarcode,
        packageMappingsByBarcode,
      );

      outputRow[header] = quantity ?? "";
    }

    output.push(outputRow);
  }

  return output;
}

export function buildWarehouseInboundListFilename(
  displayName: string,
  date = getKstTodayDate(),
): string {
  const datePart = formatKstIsoDate(date);
  const slug = displayName.trim().replace(/\s+/g, "_");

  return `창고전송용_입고리스트_${datePart}_${slug}.xlsx`;
}

export function generateWarehouseInboundListBuffer(
  rows: WarehouseInboundListRow[],
  options?: GenerateWarehouseInboundListOptions,
): Buffer {
  const todayDate = getKstTodayDate();
  const today = formatKstIsoDate(todayDate);
  const rotationCount = options?.rotationCount ?? 0;
  const columnKeys = [
    ...BASE_COLUMN_KEYS,
    ...getRotationColumnKeys(rotationCount),
  ];
  const outputRows = toOutputRows(rows, today, options);
  const worksheet = XLSX.utils.json_to_sheet(outputRows, {
    header: columnKeys,
  });

  worksheet["!cols"] = columnKeys.map((key, index) => {
    const minWidth =
      index < MIN_COLUMN_WIDTHS.length
        ? MIN_COLUMN_WIDTHS[index]!
        : ROTATION_COLUMN_MIN_WIDTH;
    const maxLen = Math.max(
      minWidth,
      getDisplayWidth(key),
      ...outputRows.map((row) => getDisplayWidth(String(row[key] ?? ""))),
    );

    return { wch: Math.min(maxLen + 4, 80) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    getKstSheetName(todayDate),
  );

  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

export function getWarehouseInboundListColumnKeys(
  rotationCount: 0 | 1 | 2 | 3 = 0,
): string[] {
  return [...BASE_COLUMN_KEYS, ...getRotationColumnKeys(rotationCount)];
}

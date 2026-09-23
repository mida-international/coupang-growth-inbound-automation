import * as XLSX from "xlsx";

import { autoFitWorksheetColumns } from "@/lib/excel/auto-fit-worksheet-columns";
import {
  matchShoplingInboundInventoryRow,
  type ShoplingInboundInventoryRow,
} from "@/lib/deliverables/resolve-shopling-inbound-barcodes";

const LOCATION_COL = 2;
const PRODUCT_COL = 3;
const OPTION_COL = 4;
const BARCODE_COL = 5;

export type FillShoplingInboundOriginalStats = {
  totalAttempted: number;
  matched: number;
  unmapped: number;
  ambiguous: number;
  skippedDummy: number;
};

export type FillShoplingInboundOriginalResult = {
  buffer: Buffer;
  bookType: XLSX.BookType;
  stats: FillShoplingInboundOriginalStats;
};

function readCellValue(
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  colIndex: number,
): string {
  const cell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })];

  if (cell?.v == null) {
    return "";
  }

  return String(cell.v).trim();
}

function writeCellValue(
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  colIndex: number,
  value: string,
): void {
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
  sheet[address] = { t: "s", v: value };
}

function clearCellValue(
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  colIndex: number,
): void {
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
  delete sheet[address];
}

function resolveBookType(
  workbook: XLSX.WorkBook,
  preferredBookType?: XLSX.BookType,
): XLSX.BookType {
  const runtimeBookType = (workbook as XLSX.WorkBook & { bookType?: XLSX.BookType })
    .bookType;

  return runtimeBookType ?? preferredBookType ?? "xlsx";
}

export function fillShoplingInboundOriginalFile(
  buffer: ArrayBuffer | Buffer,
  inventoryRows: ShoplingInboundInventoryRow[],
  options?: { bookType?: XLSX.BookType },
): FillShoplingInboundOriginalResult {
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const workbook = XLSX.read(data, { type: "buffer", cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet?.["!ref"]) {
    const bookType = resolveBookType(workbook, options?.bookType);

    return {
      buffer: XLSX.write(workbook, { type: "buffer", bookType }),
      bookType,
      stats: {
        totalAttempted: 0,
        matched: 0,
        unmapped: 0,
        ambiguous: 0,
        skippedDummy: 0,
      },
    };
  }

  const range = XLSX.utils.decode_range(firstSheet["!ref"]);
  const stats: FillShoplingInboundOriginalStats = {
    totalAttempted: 0,
    matched: 0,
    unmapped: 0,
    ambiguous: 0,
    skippedDummy: 0,
  };

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex++) {
    const productLabel = readCellValue(firstSheet, rowIndex, PRODUCT_COL);

    if (!productLabel) {
      continue;
    }

    const optionValue = readCellValue(firstSheet, rowIndex, OPTION_COL);
    stats.totalAttempted += 1;

    const match = matchShoplingInboundInventoryRow(
      productLabel,
      optionValue,
      inventoryRows,
    );

    if (match.status === "matched") {
      stats.matched += 1;

      if (match.location) {
        writeCellValue(firstSheet, rowIndex, LOCATION_COL, match.location);
      } else {
        clearCellValue(firstSheet, rowIndex, LOCATION_COL);
      }

      writeCellValue(firstSheet, rowIndex, BARCODE_COL, match.barcode);
      continue;
    }

    if (match.status === "unmapped") {
      stats.unmapped += 1;
    } else if (match.status === "ambiguous") {
      stats.ambiguous += 1;
    } else if (match.status === "skippedDummy") {
      stats.skippedDummy += 1;
    }

    clearCellValue(firstSheet, rowIndex, LOCATION_COL);
    clearCellValue(firstSheet, rowIndex, BARCODE_COL);
  }

  autoFitWorksheetColumns(firstSheet);

  const bookType = resolveBookType(workbook, options?.bookType);

  return {
    buffer: XLSX.write(workbook, { type: "buffer", bookType }),
    bookType,
    stats,
  };
}

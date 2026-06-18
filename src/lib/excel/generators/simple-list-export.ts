import * as XLSX from "xlsx";

import { autoFitWorksheetColumns } from "@/lib/excel/auto-fit-worksheet-columns";

export type SimpleListColumn = {
  key: string;
  header: string;
};

export type GenerateSimpleListBufferOptions = {
  sheetName: string;
  columns: SimpleListColumn[];
  rows: Record<string, string | number | null | undefined>[];
};

export function generateSimpleListBuffer({
  sheetName,
  columns,
  rows,
}: GenerateSimpleListBufferOptions): Buffer {
  const headerKeys = columns.map((column) => column.header);
  const outputRows = rows.map((row) => {
    const output: Record<string, string | number> = {};

    for (const column of columns) {
      const value = row[column.key];
      output[column.header] =
        value === null || value === undefined ? "" : value;
    }

    return output;
  });

  const worksheet = XLSX.utils.json_to_sheet(outputRows, {
    header: headerKeys,
  });
  autoFitWorksheetColumns(worksheet);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

export type WorksheetSpec = {
  sheetName: string;
  columns: SimpleListColumn[];
  rows: Record<string, string | number | null | undefined>[];
};

export function generateMultiSheetListBuffer(
  sheets: WorksheetSpec[],
): Buffer {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const headerKeys = sheet.columns.map((column) => column.header);
    const outputRows = sheet.rows.map((row) => {
      const output: Record<string, string | number> = {};

      for (const column of sheet.columns) {
        const value = row[column.key];
        output[column.header] =
          value === null || value === undefined ? "" : value;
      }

      return output;
    });

    const worksheet = XLSX.utils.json_to_sheet(outputRows, {
      header: headerKeys,
    });
    autoFitWorksheetColumns(worksheet);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName);
  }

  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

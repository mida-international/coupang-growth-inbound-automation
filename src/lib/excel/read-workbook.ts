import "server-only";

import * as XLSX from "xlsx";

export type ReadExcelRowsOptions = {
  maxRows?: number;
};

export function readExcelRows(
  buffer: ArrayBuffer | Buffer,
  options?: ReadExcelRowsOptions,
): unknown[][] {
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  const workbook = XLSX.read(data, {
    type: "buffer",
    cellDates: false,
    sheetRows: options?.maxRows,
  });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
  }) as unknown[][];
}

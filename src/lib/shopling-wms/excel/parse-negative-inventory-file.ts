import * as XLSX from "xlsx";

import { parseNegativeInventorySheetRows } from "@/lib/shopling-wms/excel/parse-negative-inventory";

export function parseNegativeInventoryFile(
  buffer: Buffer,
): ReturnType<typeof parseNegativeInventorySheetRows> {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return { rows: [], empty: true };
  }

  const sheet = workbook.Sheets[firstSheetName];

  if (!sheet) {
    return { rows: [], empty: true };
  }

  const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  return parseNegativeInventorySheetRows(sheetRows);
}

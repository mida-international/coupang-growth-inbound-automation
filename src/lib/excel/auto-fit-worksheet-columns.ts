import * as XLSX from "xlsx";

export function getDisplayWidth(value: string): number {
  let width = 0;

  for (const character of value) {
    width += character.charCodeAt(0) > 0x7f ? 2 : 1;
  }

  return width;
}

type AutoFitWorksheetColumnsOptions = {
  minWidth?: number;
  padding?: number;
  maxWidth?: number;
};

function readCellDisplayValue(
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

export function autoFitWorksheetColumns(
  sheet: XLSX.WorkSheet,
  options?: AutoFitWorksheetColumnsOptions,
): void {
  if (!sheet["!ref"]) {
    return;
  }

  const minWidth = options?.minWidth ?? 6;
  const padding = options?.padding ?? 4;
  const maxWidth = options?.maxWidth ?? 80;
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const existingCols = sheet["!cols"] ?? [];
  const cols: Array<{ wch: number }> = [];

  for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex++) {
    let maxLen = 0;

    for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex++) {
      const value = readCellDisplayValue(sheet, rowIndex, colIndex);
      maxLen = Math.max(maxLen, getDisplayWidth(value));
    }

    const existingWidth = existingCols[colIndex]?.wch ?? 0;
    const fittedWidth = Math.min(
      Math.max(minWidth, maxLen + padding),
      maxWidth,
    );

    cols[colIndex] = { wch: Math.max(existingWidth, fittedWidth) };
  }

  sheet["!cols"] = cols;
}

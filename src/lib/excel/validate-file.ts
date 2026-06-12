export const EXCEL_EXTENSIONS = [".xlsx", ".xls"] as const;

export const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;

export const FILE_INPUT_ACCEPT =
  ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

export function isExcelFile(file: File) {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  if (EXCEL_EXTENSIONS.includes(extension as (typeof EXCEL_EXTENSIONS)[number])) {
    return true;
  }

  return file.type
    ? EXCEL_MIME_TYPES.includes(file.type as (typeof EXCEL_MIME_TYPES)[number])
    : false;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

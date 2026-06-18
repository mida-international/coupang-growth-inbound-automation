import * as XLSX from "xlsx";

import { CENTER_SEPARATION_EXCEL_HEADERS } from "@/lib/excel/targets/center-separation";

export type ParsedCenterSeparationRow = {
  barcode: string;
};

export type ParseCenterSeparationResult =
  | {
      ok: true;
      rows: ParsedCenterSeparationRow[];
      skippedEmptyBarcode: number;
    }
  | { ok: false; error: string };

const BARCODE_HEADER_ALIASES = ["바코드", "barcode"];

function normalizeHeaderKey(value: string): string {
  return value.replace(/\s/g, "").toLowerCase();
}

function toCellString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function resolveBarcodeHeaderKey(rowKeys: string[]): string | null {
  const normalizedKeys = new Map(
    rowKeys.map((key) => [normalizeHeaderKey(key), key] as const),
  );

  for (const alias of BARCODE_HEADER_ALIASES) {
    const matchedKey = normalizedKeys.get(normalizeHeaderKey(alias));

    if (matchedKey) {
      return matchedKey;
    }
  }

  return null;
}

function readBarcode(
  row: Record<string, unknown>,
  barcodeHeaderKey: string,
): string {
  return toCellString(row[barcodeHeaderKey]);
}

export function parseCenterSeparationFromRows(
  rows: Record<string, unknown>[],
): ParseCenterSeparationResult {
  if (rows.length === 0) {
    return {
      ok: false,
      error: "엑셀에 데이터가 없습니다. (헤더만 있거나 빈 파일)",
    };
  }

  const barcodeHeaderKey = resolveBarcodeHeaderKey(Object.keys(rows[0] ?? {}));

  if (!barcodeHeaderKey) {
    return {
      ok: false,
      error: '필수 컬럼 "바코드"를 찾을 수 없습니다.',
    };
  }

  const parsedRows: ParsedCenterSeparationRow[] = [];
  let skippedEmptyBarcode = 0;

  for (const row of rows) {
    const barcode = readBarcode(row, barcodeHeaderKey);

    if (barcode === "") {
      skippedEmptyBarcode += 1;
      continue;
    }

    parsedRows.push({ barcode });
  }

  return {
    ok: true,
    rows: parsedRows,
    skippedEmptyBarcode,
  };
}

export function parseCenterSeparation(
  buffer: ArrayBuffer | Buffer,
): ParseCenterSeparationResult {
  let workbook: XLSX.WorkBook;

  try {
    const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    workbook = XLSX.read(data, { type: "buffer" });
  } catch {
    return {
      ok: false,
      error: "엑셀 파일을 읽을 수 없습니다. 파일이 손상되었거나 암호가 걸려있을 수 있습니다.",
    };
  }

  if (workbook.SheetNames.length === 0) {
    return { ok: false, error: "엑셀에 시트가 없습니다." };
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]!];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
    raw: false,
  });

  return parseCenterSeparationFromRows(rows);
}

import type { sheets_v4 } from "googleapis";

import {
  buildSpreadsheetUrl,
  createGoogleSheetsClient,
  type GoogleSheetsConfig,
} from "@/lib/google-sheets/client";

/**
 * 시트 구조는 고정하지 않고 읽어서 찾는다 (사람이 열을 끼우거나 옮겨도 따라가도록).
 * - 바코드 열: A~Z 중 바코드 형태 값이 가장 많은 열 (없으면 기존 기본값 O열)
 * - 제목 행: 바코드 열 오른쪽에 날짜 제목이 있는 행 (없으면 "바코드" 글자가 있는 행, 없으면 1행)
 * - 새 날짜 열 위치: 바코드 열 오른쪽에서 처음 나오는 날짜 제목 열 (없으면 바코드 열 바로 오른쪽)
 */
const DEFAULT_BARCODE_COLUMN_INDEX = 14;
/** 바코드 열을 찾는 범위 (A~Z) */
const BARCODE_SCAN_COLUMN_COUNT = 26;
/** 제목 행을 찾는 범위 (위에서 N행) */
const HEADER_SCAN_ROW_COUNT = 10;
/** 바코드 열 오른쪽에서 첫 날짜 제목 열을 찾는 범위 */
const DATE_HEADER_SCAN_COLUMN_COUNT = 10;
/**
 * 같은 제목의 기존 열을 찾는 범위 (새 날짜 열 위치부터 N개 열).
 * 새 날짜 열은 항상 같은 위치에 들어가므로 오늘 열은 그 근처에 있고,
 * 지난 날짜 열은 하루에 약 2열(창고 'M/D' + 쿠팡 'M/D(완)')씩 오른쪽으로 밀린다.
 * 범위를 날짜에 맞춰 좁혀 두면 제목에 연도가 없어도 작년 같은 날짜 열과 헷갈리지 않는다.
 */
export const TITLE_SEARCH_COLUMN_COUNT = 10;
/** 날짜 1일당 넓힐 검색 열 수 (하루 약 2열 + 여유) */
const SEARCH_COLUMNS_PER_DAY = 3;
/** 이보다 오래된 날짜는 시트를 건드리지 않는다 (작년 같은 날짜 열 오인 방지) */
export const MAX_SYNC_DAYS_AGO = 60;

/** 며칠 전 날짜인지에 맞춘 검색 범위 (오늘 = 10열, 5일 전 = 25열) */
export function titleSearchColumnCount(daysAgo: number): number {
  return TITLE_SEARCH_COLUMN_COUNT + Math.max(0, daysAgo) * SEARCH_COLUMNS_PER_DAY;
}
const READ_ROW_LIMIT = 100000;

export type InsertTrendsDateColumnInput = {
  spreadsheetId: string;
  sheetGid: number;
  /** 날짜 열 헤더 제목. 예: "6/22" 또는 "6/22(완)" */
  title: string;
  /** 바코드(숫자 문자열) → 값 */
  barcodeToValue: Map<string, number>;
  /** 기존 열 검색 범위 (새 날짜 열 위치부터 열 수). 기본 TITLE_SEARCH_COLUMN_COUNT */
  searchColumnCount?: number;
  /** 기존 열이 없을 때 새로 넣을지 (기본 true). 원복 동기화는 false */
  insertIfMissing?: boolean;
};

export type InsertTrendsDateColumnResult = {
  sheetUrl: string;
  sheetTitle: string;
  /** O열에서 바코드로 인식된 행 수 */
  barcodeRowCount: number;
  /** 그중 값이 매칭되어 채워진 수 */
  matchedCount: number;
  /** 새 열을 삽입했으면 true, 기존 열 값만 갱신했으면 false */
  created: boolean;
  /** 기존 열이 없고 insertIfMissing=false라 아무것도 하지 않았으면 true */
  skipped: boolean;
};

function escapeSheetTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

function normalizeBarcode(value: string): string {
  return value.trim().replace(/\s/g, "");
}

function isBarcode(value: string): boolean {
  return /^\d{6,14}$/.test(value);
}

/** 날짜 열 제목처럼 보이는지 (예: "9/21", "9월 21일", "9/21(완)", "완9/21") */
export function looksLikeDateHeader(cell: string): boolean {
  const trimmed = cell.trim().replace(/\(완\)$/, "").replace(/^완\s*/, "");
  return /^0?\d{1,2}[./월\s]+0?\d{1,2}일?\.?$/.test(trimmed);
}

/** A~Z 중 바코드 형태 값이 가장 많은 열 (0 기준). 하나도 없으면 null */
export function detectBarcodeColumnIndex(rows: string[][]): number | null {
  const counts = new Array<number>(BARCODE_SCAN_COLUMN_COUNT).fill(0);

  for (const row of rows) {
    for (let column = 0; column < BARCODE_SCAN_COLUMN_COUNT; column += 1) {
      if (isBarcode(normalizeBarcode(row[column] ?? ""))) {
        counts[column] += 1;
      }
    }
  }

  const best = counts.reduce(
    (bestIndex, count, index) => (count > counts[bestIndex] ? index : bestIndex),
    0,
  );

  return counts[best] > 0 ? best : null;
}

/** 제목 행(0 기준): 바코드 열 오른쪽에 날짜 제목이 있는 첫 행 → "바코드" 글자 행 → 0 */
export function detectHeaderRowIndex(
  formattedRows: string[][],
  barcodeColumnIndex: number,
): number {
  const scanRows = formattedRows.slice(0, HEADER_SCAN_ROW_COUNT);
  const dateRow = scanRows.findIndex((row) =>
    row
      .slice(barcodeColumnIndex + 1, barcodeColumnIndex + 1 + DATE_HEADER_SCAN_COLUMN_COUNT)
      .some((cell) => looksLikeDateHeader(cell ?? "")),
  );

  if (dateRow >= 0) {
    return dateRow;
  }

  const labelRow = scanRows.findIndex((row) =>
    /바코드|barcode/i.test((row[barcodeColumnIndex] ?? "").trim()),
  );

  return labelRow >= 0 ? labelRow : 0;
}

/** 새 날짜 열 위치(0 기준): 바코드 열 오른쪽 첫 날짜 제목 열, 없으면 바코드 열 바로 오른쪽 */
export function detectInsertColumnIndex(
  headerCells: string[],
  barcodeColumnIndex: number,
): number {
  for (
    let column = barcodeColumnIndex + 1;
    column <= barcodeColumnIndex + DATE_HEADER_SCAN_COLUMN_COUNT;
    column += 1
  ) {
    if (looksLikeDateHeader(headerCells[column] ?? "")) {
      return column;
    }
  }

  return barcodeColumnIndex + 1;
}

/** 0 기준 열 번호 → A1 표기 열 문자 (15 → "P", 26 → "AA") */
export function columnIndexToLetter(index: number): string {
  let letter = "";
  let current = index + 1;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    current = Math.floor((current - 1) / 26);
  }

  return letter;
}

/**
 * 헤더 셀이 같은 제목인지 비교. 'M/D' 제목은 시트에서 날짜 셀로 저장되어
 * 표시 형식이 달라질 수 있으므로 숫자(월/일) 기준으로도 비교한다.
 * '(완)' 접미사가 붙은 제목은 정확히 일치할 때만 매칭된다.
 */
export function headerCellMatchesTitle(cell: string, title: string): boolean {
  const trimmed = cell.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed === title) {
    return true;
  }

  const titleMatch = title.match(/^(\d{1,2})\/(\d{1,2})$/);

  if (!titleMatch) {
    return false;
  }

  const cellMatch = trimmed.match(/^0?(\d{1,2})[./월\s]+0?(\d{1,2})일?\.?$/);

  if (!cellMatch) {
    return false;
  }

  return (
    Number(cellMatch[1]) === Number(titleMatch[1]) &&
    Number(cellMatch[2]) === Number(titleMatch[2])
  );
}

/** 새 날짜 열 위치부터 읽은 헤더 셀 중 제목이 같은 첫 열의 위치(0부터). 없으면 -1. */
export function findTitleColumnOffset(
  headerCells: string[],
  title: string,
  searchColumnCount = TITLE_SEARCH_COLUMN_COUNT,
): number {
  return headerCells
    .slice(0, searchColumnCount)
    .findIndex((cell) => headerCellMatchesTitle(cell, title));
}

/** O열 각 행에 맞춰 날짜 열 값 배열을 만든다 (헤더 행 = 제목, 바코드 없는 행 = 빈칸). */
export function buildDateColumnValues(
  oValues: string[],
  headerRowIndex: number,
  title: string,
  barcodeToValue: Map<string, number>,
): { values: string[][]; barcodeRowCount: number; matchedCount: number } {
  let barcodeRowCount = 0;
  let matchedCount = 0;

  const values: string[][] = oValues.map((cell, rowIndex) => {
    if (rowIndex === headerRowIndex) {
      return [title];
    }

    const key = normalizeBarcode(cell.trim());

    if (!isBarcode(key)) {
      return [""];
    }

    barcodeRowCount += 1;
    const value = barcodeToValue.get(key);

    if (value === undefined) {
      return [""];
    }

    matchedCount += 1;
    return [String(value)];
  });

  if (values.length === 0) {
    values.push([title]);
  }

  return { values, barcodeRowCount, matchedCount };
}

function toCellStrings(values: unknown[][] | null | undefined): string[][] {
  return (values ?? []).map((row) =>
    row.map((cell) => (cell !== undefined && cell !== null ? String(cell) : "")),
  );
}

async function locateTrendsSheet(
  sheetsClient: sheets_v4.Sheets,
  input: { spreadsheetId: string; sheetGid: number },
): Promise<{
  sheetTitle: string;
  escapedTitle: string;
  /** 바코드 열의 행별 값 */
  oValues: string[];
  headerRowIndex: number;
  insertColumnIndex: number;
}> {
  // gid로 탭(시트) 찾기 → 탭 제목 확보
  const spreadsheet = await sheetsClient.spreadsheets.get({
    spreadsheetId: input.spreadsheetId,
  });

  const sheet = spreadsheet.data.sheets?.find(
    (item) => item.properties?.sheetId === input.sheetGid,
  );

  if (!sheet?.properties?.title) {
    throw new Error(
      `대상 시트 탭(gid=${input.sheetGid})을 찾을 수 없습니다. GOOGLE_TRENDS_SHEET_GID를 확인해 주세요.`,
    );
  }

  const sheetTitle = sheet.properties.title;
  const escapedTitle = escapeSheetTitle(sheetTitle);

  // A~Z 값(바코드 열 찾기) + 위쪽 행 표시값(날짜 제목은 날짜 셀이라 표시값으로 본다)
  const [valuesResponse, headerResponse] = await Promise.all([
    sheetsClient.spreadsheets.values.get({
      spreadsheetId: input.spreadsheetId,
      range: `${escapedTitle}!A1:${columnIndexToLetter(BARCODE_SCAN_COLUMN_COUNT - 1)}${READ_ROW_LIMIT}`,
      valueRenderOption: "UNFORMATTED_VALUE",
    }),
    sheetsClient.spreadsheets.values.get({
      spreadsheetId: input.spreadsheetId,
      range: `${escapedTitle}!A1:${columnIndexToLetter(BARCODE_SCAN_COLUMN_COUNT + DATE_HEADER_SCAN_COLUMN_COUNT)}${HEADER_SCAN_ROW_COUNT}`,
    }),
  ]);

  const rows = toCellStrings(valuesResponse.data.values);
  const formattedRows = toCellStrings(headerResponse.data.values);
  const barcodeColumnIndex =
    detectBarcodeColumnIndex(rows) ?? DEFAULT_BARCODE_COLUMN_INDEX;
  const headerRowIndex = detectHeaderRowIndex(formattedRows, barcodeColumnIndex);

  return {
    sheetTitle,
    escapedTitle,
    oValues: rows.map((row) => row[barcodeColumnIndex] ?? ""),
    headerRowIndex,
    insertColumnIndex: detectInsertColumnIndex(
      formattedRows[headerRowIndex] ?? [],
      barcodeColumnIndex,
    ),
  };
}

/** 헤더 행에서 같은 제목의 기존 날짜 열 번호(0 기준)를 찾는다. 없으면 null. */
async function findExistingTitleColumn(
  sheetsClient: sheets_v4.Sheets,
  input: {
    spreadsheetId: string;
    escapedTitle: string;
    headerRowNumber: number;
    title: string;
    searchColumnCount: number;
    insertColumnIndex: number;
  },
): Promise<number | null> {
  const startLetter = columnIndexToLetter(input.insertColumnIndex);
  const endLetter = columnIndexToLetter(
    input.insertColumnIndex + input.searchColumnCount - 1,
  );

  const headerResponse = await sheetsClient.spreadsheets.values.get({
    spreadsheetId: input.spreadsheetId,
    range: `${input.escapedTitle}!${startLetter}${input.headerRowNumber}:${endLetter}${input.headerRowNumber}`,
  });

  const headerCells = (headerResponse.data.values?.[0] ?? []).map((cell) =>
    cell !== undefined && cell !== null ? String(cell) : "",
  );

  const offset = findTitleColumnOffset(
    headerCells,
    input.title,
    input.searchColumnCount,
  );

  return offset >= 0 ? input.insertColumnIndex + offset : null;
}

async function writeColumnValues(
  sheetsClient: sheets_v4.Sheets,
  input: {
    spreadsheetId: string;
    escapedTitle: string;
    columnIndex: number;
    values: string[][];
  },
): Promise<void> {
  const letter = columnIndexToLetter(input.columnIndex);

  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: input.spreadsheetId,
    range: `${input.escapedTitle}!${letter}1:${letter}${input.values.length}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: input.values,
    },
  });
}

/**
 * 날짜 열을 반영한다.
 * - 같은 제목의 열이 새 날짜 열 위치 근처(검색 범위 안)에 이미 있으면: 열은 그대로 두고 값만 덮어쓴다
 *   (열 순서·그 열을 참조하는 수식 유지).
 * - 없으면: 새 날짜 열 위치(가장 최근 날짜 열 앞)에 빈 열을 삽입하고 값을 쓴다.
 *   insertIfMissing=false면 아무것도 하지 않는다.
 */
export async function insertTrendsDateColumn(
  config: GoogleSheetsConfig,
  input: InsertTrendsDateColumnInput,
  options?: { sheetsClient?: sheets_v4.Sheets },
): Promise<InsertTrendsDateColumnResult> {
  const sheetsClient = options?.sheetsClient ?? createGoogleSheetsClient(config);

  // 1. gid로 탭 찾기 + 바코드 열·제목 행·새 열 위치 찾기
  const { sheetTitle, escapedTitle, oValues, headerRowIndex, insertColumnIndex } =
    await locateTrendsSheet(sheetsClient, input);

  // 2. 바코드 열 각 행에 맞춰 값 배열 구성
  const { values, barcodeRowCount, matchedCount } = buildDateColumnValues(
    oValues,
    headerRowIndex,
    input.title,
    input.barcodeToValue,
  );

  // 3. 같은 제목의 기존 열 찾기 (같은 날 재실행이면 값만 갱신)
  const existingColumnIndex = await findExistingTitleColumn(sheetsClient, {
    spreadsheetId: input.spreadsheetId,
    escapedTitle,
    headerRowNumber: headerRowIndex + 1,
    title: input.title,
    searchColumnCount: input.searchColumnCount ?? TITLE_SEARCH_COLUMN_COUNT,
    insertColumnIndex,
  });

  if (existingColumnIndex === null && input.insertIfMissing === false) {
    return {
      sheetUrl: buildSpreadsheetUrl(input.spreadsheetId, input.sheetGid),
      sheetTitle,
      barcodeRowCount,
      matchedCount: 0,
      created: false,
      skipped: true,
    };
  }

  // 4. 없으면 새 날짜 열 위치에 빈 열 삽입 (기존 열은 오른쪽으로 밀린다)
  if (existingColumnIndex === null) {
    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: input.spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: input.sheetGid,
                dimension: "COLUMNS",
                startIndex: insertColumnIndex,
                endIndex: insertColumnIndex + 1,
              },
              inheritFromBefore: false,
            },
          },
        ],
      },
    });
  }

  // 5. 값 기입
  await writeColumnValues(sheetsClient, {
    spreadsheetId: input.spreadsheetId,
    escapedTitle,
    columnIndex: existingColumnIndex ?? insertColumnIndex,
    values,
  });

  return {
    sheetUrl: buildSpreadsheetUrl(input.spreadsheetId, input.sheetGid),
    sheetTitle,
    barcodeRowCount,
    matchedCount,
    created: existingColumnIndex === null,
    skipped: false,
  };
}

/**
 * 같은 제목의 날짜 열 값을 비운다 (제목은 남긴다).
 * 그날 기록이 모두 원복되어 값이 없을 때 사용한다. 열이 없으면 아무것도 하지 않는다.
 */
export async function clearTrendsDateColumn(
  config: GoogleSheetsConfig,
  input: {
    spreadsheetId: string;
    sheetGid: number;
    title: string;
    searchColumnCount?: number;
  },
  options?: { sheetsClient?: sheets_v4.Sheets },
): Promise<{ sheetUrl: string; cleared: boolean }> {
  const sheetsClient = options?.sheetsClient ?? createGoogleSheetsClient(config);
  const { escapedTitle, oValues, headerRowIndex, insertColumnIndex } =
    await locateTrendsSheet(sheetsClient, input);

  const existingColumnIndex = await findExistingTitleColumn(sheetsClient, {
    spreadsheetId: input.spreadsheetId,
    escapedTitle,
    headerRowNumber: headerRowIndex + 1,
    title: input.title,
    searchColumnCount: input.searchColumnCount ?? TITLE_SEARCH_COLUMN_COUNT,
    insertColumnIndex,
  });

  if (existingColumnIndex !== null) {
    const { values } = buildDateColumnValues(
      oValues,
      headerRowIndex,
      input.title,
      new Map(),
    );

    await writeColumnValues(sheetsClient, {
      spreadsheetId: input.spreadsheetId,
      escapedTitle,
      columnIndex: existingColumnIndex,
      values,
    });
  }

  return {
    sheetUrl: buildSpreadsheetUrl(input.spreadsheetId, input.sheetGid),
    cleared: existingColumnIndex !== null,
  };
}

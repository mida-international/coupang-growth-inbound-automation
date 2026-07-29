import type { sheets_v4 } from "googleapis";

import {
  buildSpreadsheetUrl,
  createGoogleSheetsClient,
  type GoogleSheetsConfig,
} from "@/lib/google-sheets/client";

/** 바코드가 들어있는 열 (A=0 기준 O=14). */
const BARCODE_COLUMN_LETTER = "O";
/** 새 값을 넣을 열 (A=0 기준 P=15). 여기 빈 열을 삽입하고 기존 P 이후를 오른쪽으로 민다. */
const INSERT_COLUMN_LETTER = "P";
const INSERT_COLUMN_INDEX = 15;
const READ_ROW_LIMIT = 100000;

export type InsertTrendsDateColumnInput = {
  spreadsheetId: string;
  sheetGid: number;
  /** P열 맨 위(헤더)에 들어갈 제목. 예: "6/22" 또는 "6/22(완)" */
  title: string;
  /** 바코드(숫자 문자열) → 값 */
  barcodeToValue: Map<string, number>;
};

export type InsertTrendsDateColumnResult = {
  sheetUrl: string;
  sheetTitle: string;
  /** O열에서 바코드로 인식된 행 수 */
  barcodeRowCount: number;
  /** 그중 값이 매칭되어 채워진 수 */
  matchedCount: number;
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

/**
 * 헤더 셀이 같은 제목인지 비교. 'M/D' 제목은 시트에서 날짜 셀로 저장되어
 * 표시 형식이 달라질 수 있으므로 숫자(월/일) 기준으로도 비교한다.
 * '(완)' 접미사가 붙은 제목은 정확히 일치할 때만 매칭된다.
 */
function headerCellMatchesTitle(cell: string, title: string): boolean {
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

export async function insertTrendsDateColumn(
  config: GoogleSheetsConfig,
  input: InsertTrendsDateColumnInput,
  options?: { sheetsClient?: sheets_v4.Sheets },
): Promise<InsertTrendsDateColumnResult> {
  const sheetsClient = options?.sheetsClient ?? createGoogleSheetsClient(config);

  // 1. gid로 탭(시트) 찾기 → 탭 제목 확보
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

  // 2. O열(바코드) 읽기 — 열 삽입 전에 읽는다 (O열은 삽입 위치 P보다 왼쪽이라 영향 없음)
  const oResponse = await sheetsClient.spreadsheets.values.get({
    spreadsheetId: input.spreadsheetId,
    range: `${escapedTitle}!${BARCODE_COLUMN_LETTER}1:${BARCODE_COLUMN_LETTER}${READ_ROW_LIMIT}`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const oValues = (oResponse.data.values ?? []).map((row) =>
    row[0] !== undefined && row[0] !== null ? String(row[0]) : "",
  );

  // 3. O열 각 행에 맞춰 P열 값 배열 구성
  const foundHeaderRowIndex = oValues.findIndex((cell) =>
    /바코드|barcode/i.test(cell.trim()),
  );
  const headerRowIndex = foundHeaderRowIndex >= 0 ? foundHeaderRowIndex : 0;

  let barcodeRowCount = 0;
  let matchedCount = 0;

  const pColumn: string[][] = oValues.map((cell, rowIndex) => {
    if (rowIndex === headerRowIndex) {
      return [input.title];
    }

    const key = normalizeBarcode(cell.trim());

    if (isBarcode(key)) {
      barcodeRowCount += 1;
      const value = input.barcodeToValue.get(key);

      if (value !== undefined) {
        matchedCount += 1;
        return [String(value)];
      }

      return [""];
    }

    return [""];
  });

  if (pColumn.length === 0) {
    pColumn.push([input.title]);
  }

  // 4. 같은 제목의 기존 열이 있으면 삭제 (같은 날 재실행 시 열이 쌓이지 않도록 갱신)
  const headerRowNumber = headerRowIndex + 1;
  const headerResponse = await sheetsClient.spreadsheets.values.get({
    spreadsheetId: input.spreadsheetId,
    range: `${escapedTitle}!${INSERT_COLUMN_LETTER}${headerRowNumber}:ZZ${headerRowNumber}`,
  });

  const headerCells = (headerResponse.data.values?.[0] ?? []).map((cell) =>
    cell !== undefined && cell !== null ? String(cell) : "",
  );

  const duplicateOffsets = headerCells
    .map((cell, offset) =>
      headerCellMatchesTitle(cell, input.title) ? offset : -1,
    )
    .filter((offset) => offset >= 0);

  // 오른쪽 열부터 지워야 남은 열 인덱스가 밀리지 않는다
  for (const offset of duplicateOffsets.reverse()) {
    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: input.spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: input.sheetGid,
                dimension: "COLUMNS",
                startIndex: INSERT_COLUMN_INDEX + offset,
                endIndex: INSERT_COLUMN_INDEX + offset + 1,
              },
            },
          },
        ],
      },
    });
  }

  // 5. P열 위치에 빈 열 삽입 (기존 P 이후를 오른쪽으로 민다)
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: input.spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId: input.sheetGid,
              dimension: "COLUMNS",
              startIndex: INSERT_COLUMN_INDEX,
              endIndex: INSERT_COLUMN_INDEX + 1,
            },
            inheritFromBefore: false,
          },
        },
      ],
    },
  });

  // 6. 새로 삽입된 빈 P열에 값 기입
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: input.spreadsheetId,
    range: `${escapedTitle}!${INSERT_COLUMN_LETTER}1:${INSERT_COLUMN_LETTER}${pColumn.length}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: pColumn,
    },
  });

  return {
    sheetUrl: buildSpreadsheetUrl(input.spreadsheetId, input.sheetGid),
    sheetTitle,
    barcodeRowCount,
    matchedCount,
  };
}

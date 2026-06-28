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
  let barcodeRowCount = 0;
  let matchedCount = 0;
  let headerWritten = false;

  const pColumn: string[][] = oValues.map((cell) => {
    const trimmed = cell.trim();
    const key = normalizeBarcode(trimmed);

    if (isBarcode(key)) {
      barcodeRowCount += 1;
      const value = input.barcodeToValue.get(key);

      if (value !== undefined) {
        matchedCount += 1;
        return [String(value)];
      }

      return [""];
    }

    // 바코드 헤더 행이면 제목을 넣는다
    if (!headerWritten && /바코드|barcode/i.test(trimmed)) {
      headerWritten = true;
      return [input.title];
    }

    return [""];
  });

  // 헤더("바코드") 행을 못 찾았으면 1행에 제목을 넣는다
  if (!headerWritten) {
    if (pColumn.length > 0) {
      pColumn[0] = [input.title];
    } else {
      pColumn.push([input.title]);
    }
  }

  // 4. P열 위치에 빈 열 삽입 (기존 P 이후를 오른쪽으로 민다)
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

  // 5. 새로 삽입된 빈 P열에 값 기입
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

import type { sheets_v4 } from "googleapis";

import {
  buildSpreadsheetUrl,
  createGoogleSheetsClient,
  type GoogleSheetsConfig,
} from "@/lib/google-sheets/client";

export type WriteGridToSheetInput = {
  spreadsheetId: string;
  sheetTitle: string;
  headers: string[];
  rows: string[][];
  /**
   * 제목이 정확히 일치하는 탭이 없을 때, 이 매처에 걸리는 기존 탭을
   * sheetTitle로 리네임해 재사용한다 (날짜 프리픽스가 바뀌는 탭 갱신용).
   */
  reuseSheetMatcher?: (title: string) => boolean;
};

export type WriteGridToSheetResult = {
  sheetUrl: string;
  sheetTitle: string;
};

function escapeSheetTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

function findSheetByTitle(
  sheets: sheets_v4.Schema$Sheet[] | undefined | null,
  sheetTitle: string,
) {
  return sheets?.find((sheet) => sheet.properties?.title === sheetTitle) ?? null;
}

export async function writeGridToGoogleSheet(
  config: GoogleSheetsConfig,
  input: WriteGridToSheetInput,
  options?: { sheetsClient?: sheets_v4.Sheets },
): Promise<WriteGridToSheetResult> {
  const sheetsClient = options?.sheetsClient ?? createGoogleSheetsClient(config);
  const spreadsheet = await sheetsClient.spreadsheets.get({
    spreadsheetId: input.spreadsheetId,
  });

  let sheet = findSheetByTitle(spreadsheet.data.sheets, input.sheetTitle);

  if (!sheet && input.reuseSheetMatcher) {
    const reusable = spreadsheet.data.sheets?.find((candidate) => {
      const title = candidate.properties?.title;
      return typeof title === "string" && input.reuseSheetMatcher!(title);
    });
    const reusableSheetId = reusable?.properties?.sheetId;

    if (reusableSheetId !== undefined && reusableSheetId !== null) {
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: input.spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: reusableSheetId,
                  title: input.sheetTitle,
                },
                fields: "title",
              },
            },
          ],
        },
      });

      sheet = {
        properties: {
          sheetId: reusableSheetId,
          title: input.sheetTitle,
        },
      };
    }
  }

  if (!sheet) {
    const created = await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: input.spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: input.sheetTitle,
              },
            },
          },
        ],
      },
    });

    const createdSheetId =
      created.data.replies?.[0]?.addSheet?.properties?.sheetId;

    sheet = {
      properties: {
        sheetId: createdSheetId,
        title: input.sheetTitle,
      },
    };
  }

  const sheetId = sheet.properties?.sheetId;

  if (sheetId === undefined || sheetId === null) {
    throw new Error("Google Sheets 탭 ID를 확인할 수 없습니다.");
  }

  const escapedTitle = escapeSheetTitle(input.sheetTitle);

  await sheetsClient.spreadsheets.values.clear({
    spreadsheetId: input.spreadsheetId,
    range: `${escapedTitle}!A:ZZ`,
  });

  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: input.spreadsheetId,
    range: `${escapedTitle}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [input.headers, ...input.rows],
    },
  });

  return {
    sheetUrl: buildSpreadsheetUrl(input.spreadsheetId, sheetId),
    sheetTitle: input.sheetTitle,
  };
}

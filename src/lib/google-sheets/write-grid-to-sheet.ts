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

import { google } from "googleapis";

import {
  parseGoogleServiceAccountKey,
  parseGoogleSpreadsheetId,
  validateGoogleSpreadsheetId,
} from "@/lib/google-sheets/parse-google-env";

const SPREADSHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export type GoogleSheetsConfig = {
  serviceAccountKey: string;
  spreadsheetId: string;
  clientEmail: string | null;
};

export function getGoogleSheetsConfig():
  | { ok: true; config: GoogleSheetsConfig }
  | { ok: false; error: string } {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  const spreadsheetIdRaw =
    process.env.GOOGLE_SHEET_ID?.trim() ??
    process.env.GOOGLE_SHEET_URL?.trim() ??
    "";

  if (!serviceAccountKey || !spreadsheetIdRaw) {
    return {
      ok: false,
      error: "Google Sheets 연동이 설정되지 않았습니다.",
    };
  }

  const spreadsheetId = parseGoogleSpreadsheetId(spreadsheetIdRaw);
  const spreadsheetIdError = validateGoogleSpreadsheetId(spreadsheetId);

  if (spreadsheetIdError) {
    return {
      ok: false,
      error: spreadsheetIdError,
    };
  }

  let clientEmail: string | null = null;

  try {
    clientEmail = parseGoogleServiceAccountKey(serviceAccountKey).clientEmail;
  } catch {
    return {
      ok: false,
      error: "GOOGLE_SERVICE_ACCOUNT_KEY JSON 형식이 올바르지 않습니다.",
    };
  }

  return {
    ok: true,
    config: {
      serviceAccountKey,
      spreadsheetId,
      clientEmail,
    },
  };
}

export function createGoogleSheetsClient(config: GoogleSheetsConfig) {
  let credentials: Record<string, unknown>;

  try {
    credentials = parseGoogleServiceAccountKey(config.serviceAccountKey).credentials;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY JSON 형식이 올바르지 않습니다.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [SPREADSHEETS_SCOPE],
  });

  return google.sheets({ version: "v4", auth });
}

export function buildSpreadsheetUrl(
  spreadsheetId: string,
  sheetId: number,
): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`;
}

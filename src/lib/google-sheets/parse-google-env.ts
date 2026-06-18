export type ParsedGoogleServiceAccount = {
  credentials: Record<string, unknown>;
  clientEmail: string | null;
};

export function parseGoogleSpreadsheetId(raw: string): string {
  const trimmed = raw.trim();

  const urlMatch = trimmed.match(
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
  );

  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  return trimmed;
}

export function parseGoogleServiceAccountKey(
  raw: string,
): ParsedGoogleServiceAccount {
  let normalized = raw.trim();

  if (
    (normalized.startsWith("'") && normalized.endsWith("'")) ||
    (normalized.startsWith('"') && normalized.endsWith('"'))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  const credentials = JSON.parse(normalized) as Record<string, unknown>;
  const privateKey = credentials.private_key;

  if (typeof privateKey === "string") {
    credentials.private_key = privateKey.replace(/\\n/g, "\n");
  }

  const clientEmail =
    typeof credentials.client_email === "string"
      ? credentials.client_email
      : null;

  return {
    credentials,
    clientEmail,
  };
}

export function validateGoogleSpreadsheetId(spreadsheetId: string): string | null {
  if (spreadsheetId.length === 0) {
    return "GOOGLE_SHEET_ID가 비어 있습니다.";
  }

  if (spreadsheetId.length < 20) {
    return "GOOGLE_SHEET_ID가 너무 짧습니다. 스프레드시트 URL에서 /d/ 뒤의 전체 ID를 입력했는지 확인해 주세요.";
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(spreadsheetId)) {
    return "GOOGLE_SHEET_ID 형식이 올바르지 않습니다.";
  }

  return null;
}

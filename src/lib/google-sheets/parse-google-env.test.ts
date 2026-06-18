import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseGoogleServiceAccountKey,
  parseGoogleSpreadsheetId,
} from "@/lib/google-sheets/parse-google-env";

describe("parseGoogleSpreadsheetId", () => {
  it("extracts id from a full spreadsheet url", () => {
    assert.equal(
      parseGoogleSpreadsheetId(
        "https://docs.google.com/spreadsheets/d/abc123-def456/edit#gid=0",
      ),
      "abc123-def456",
    );
  });

  it("returns trimmed raw id", () => {
    assert.equal(parseGoogleSpreadsheetId("  abc123-def456  "), "abc123-def456");
  });
});

describe("parseGoogleServiceAccountKey", () => {
  it("parses quoted json and normalizes private key newlines", () => {
    const parsed = parseGoogleServiceAccountKey(
      `'{"type":"service_account","client_email":"test@example.com","private_key":"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n"}'`,
    );

    assert.equal(parsed.clientEmail, "test@example.com");
    assert.match(String(parsed.credentials.private_key), /\nabc\n/);
  });
});

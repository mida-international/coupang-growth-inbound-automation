import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { writeGridToGoogleSheet } from "@/lib/google-sheets/write-grid-to-sheet";
import type { GoogleSheetsConfig } from "@/lib/google-sheets/client";

const CONFIG: GoogleSheetsConfig = {
  serviceAccountKey: JSON.stringify({
    client_email: "test@example.com",
    private_key: "test-key",
  }),
  spreadsheetId: "spreadsheet-1",
};

describe("writeGridToGoogleSheet", () => {
  it("creates a missing tab, clears it, and writes grid values", async () => {
    const calls: string[] = [];

    const sheetsClient = {
      spreadsheets: {
        get: async () => ({
          data: {
            sheets: [],
          },
        }),
        batchUpdate: async () => {
          calls.push("batchUpdate");
          return {
            data: {
              replies: [
                {
                  addSheet: {
                    properties: {
                      sheetId: 42,
                      title: "6.17요청",
                    },
                  },
                },
              ],
            },
          };
        },
        values: {
          clear: async () => {
            calls.push("clear");
            return {};
          },
          update: async () => {
            calls.push("update");
            return {};
          },
        },
      },
    };

    const result = await writeGridToGoogleSheet(CONFIG, {
      spreadsheetId: "spreadsheet-1",
      sheetTitle: "6.17요청",
      headers: ["box", "수량"],
      rows: [["1", "10"]],
    }, {
      sheetsClient: sheetsClient as never,
    });

    assert.deepEqual(calls, ["batchUpdate", "clear", "update"]);
    assert.equal(
      result.sheetUrl,
      "https://docs.google.com/spreadsheets/d/spreadsheet-1/edit#gid=42",
    );
    assert.equal(result.sheetTitle, "6.17요청");
  });
});

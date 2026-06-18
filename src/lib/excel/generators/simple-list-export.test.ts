import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import { generateSimpleListBuffer } from "@/lib/excel/generators/simple-list-export";

describe("generateSimpleListBuffer", () => {
  it("writes headers and empty cells for missing values", () => {
    const buffer = generateSimpleListBuffer({
      sheetName: "목록",
      columns: [
        { key: "name", header: "이름" },
        { key: "qty", header: "수량" },
      ],
      rows: [{ name: "테스트", qty: 3 }, { name: null, qty: undefined }],
    });

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets["목록"];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
      sheet,
      { defval: "" },
    );

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.["이름"], "테스트");
    assert.equal(rows[0]?.["수량"], 3);
    assert.equal(rows[1]?.["이름"], "");
    assert.equal(rows[1]?.["수량"], "");
  });
});

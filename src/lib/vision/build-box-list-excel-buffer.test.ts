import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildBoxListExcelBuffer } from "@/lib/vision/build-box-list-excel-buffer";
import type { VisionExtractedData } from "@/lib/vision/types";

describe("buildBoxListExcelBuffer", () => {
  it("creates an xlsx buffer with barcode and quantity columns", () => {
    const visionData: VisionExtractedData = {
      columns: ["바코드", "수량"],
      rows: [
        { 바코드: "8801234567890", 수량: "3" },
        { 바코드: "8809876543210", 수량: "1" },
      ],
    };

    const buffer = buildBoxListExcelBuffer(visionData);

    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 0);
    assert.equal(buffer.subarray(0, 2).toString("utf8"), "PK");
  });
});

describe("buildBoxListExcelBuffer — 1차 개선 (검수용 컬럼)", () => {
  it("keeps the original 7 columns first and appends 수정전/신뢰도/확인필요", async () => {
    const XLSX = await import("xlsx");
    const visionData: VisionExtractedData = {
      columns: ["바코드", "수량", "가용", "printedQty", "confidence"],
      rows: [
        { 바코드: "2016342540379", 수량: "9", 가용: "", printedQty: "10", confidence: "0.95" },
        { 바코드: "2016342336033", 수량: "3", 가용: "", printedQty: "7", confidence: "0.55" },
        { 바코드: "2016342428141", 수량: "3", 가용: "", printedQty: "", confidence: "0.9" },
      ],
    };

    const buffer = buildBoxListExcelBuffer(visionData);
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
    const header = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0];

    assert.deepEqual(header.slice(0, 7), [
      "date", "location", "등록상품명", "옵션", "바코드", "수량", "가용",
    ]);
    assert.deepEqual(header.slice(7), ["수정전", "신뢰도", "확인필요"]);

    assert.equal(rows[0]["수량"], "9");
    assert.equal(rows[0]["수정전"], "10");
    assert.equal(rows[0]["확인필요"], "");

    assert.equal(rows[1]["수정전"], "7");
    assert.equal(rows[1]["신뢰도"], "0.55");
    assert.equal(rows[1]["확인필요"], "확인");

    assert.equal(rows[2]["수정전"], "");
    assert.equal(rows[2]["확인필요"], "");
  });
});

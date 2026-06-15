import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { summarizeExcelUpload } from "@/lib/coupang-growth-sync/summarize-excel-upload";

describe("summarizeExcelUpload", () => {
  it("returns success when all files succeed", () => {
    const summary = summarizeExcelUpload([
      {
        fileName: "a.xlsx",
        ok: true,
        targetId: "coupang_growth_inbound_template",
        rowCount: 100,
      },
      {
        fileName: "b.xlsx",
        ok: true,
        targetId: "coupang_growth_inventory_health",
        rowCount: 50,
      },
    ]);

    assert.equal(summary.outcome, "success");
    assert.equal(summary.results.length, 2);
  });

  it("returns partial when some files fail", () => {
    const summary = summarizeExcelUpload([
      {
        fileName: "a.xlsx",
        ok: true,
        targetId: "coupang_growth_inbound_template",
        rowCount: 100,
      },
      {
        fileName: "b.xlsx",
        ok: false,
        error: "데이터 적재에 실패했습니다.",
      },
    ]);

    assert.equal(summary.outcome, "partial");
  });

  it("returns error when all files fail", () => {
    const summary = summarizeExcelUpload([
      {
        fileName: "a.xlsx",
        ok: false,
        error: "엑셀 파일 유형을 식별할 수 없습니다.",
      },
    ]);

    assert.equal(summary.outcome, "error");
  });
});

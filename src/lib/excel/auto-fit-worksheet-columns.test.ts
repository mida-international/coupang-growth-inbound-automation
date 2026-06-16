import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import {
  autoFitWorksheetColumns,
  getDisplayWidth,
} from "@/lib/excel/auto-fit-worksheet-columns";

describe("getDisplayWidth", () => {
  it("counts wide characters as double width", () => {
    assert.equal(getDisplayWidth("abc"), 3);
    assert.equal(getDisplayWidth("品名"), 4);
  });
});

describe("autoFitWorksheetColumns", () => {
  it("sets column widths from cell content", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["CT/NO", "", "", "品名", "옵션", "", "", "", "总数量"],
      ["", "", "A-01", "气泡袋", "白色，20*30", "8801111111111", "", "", 210],
    ]);

    autoFitWorksheetColumns(sheet);

    assert.ok(sheet["!cols"]);
    assert.ok((sheet["!cols"]?.[5]?.wch ?? 0) >= 13);
  });

  it("does not shrink existing wider column widths", () => {
    const sheet = XLSX.utils.aoa_to_sheet([["short"]]);
    sheet["!cols"] = [{ wch: 40 }];

    autoFitWorksheetColumns(sheet);

    assert.equal(sheet["!cols"]?.[0]?.wch, 40);
  });

  it("no-ops when sheet has no ref", () => {
    const sheet: XLSX.WorkSheet = {};

    autoFitWorksheetColumns(sheet);

    assert.equal(sheet["!cols"], undefined);
  });
});

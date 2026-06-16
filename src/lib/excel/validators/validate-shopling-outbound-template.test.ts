import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import { getShoplingOutboundTemplatePath } from "@/lib/excel/targets/shopling-gross-outbound-template";
import { validateShoplingOutboundTemplateFile } from "@/lib/excel/validators/validate-shopling-outbound-template";

describe("validateShoplingOutboundTemplateFile", () => {
  it("accepts the bundled shopling gross outbound template", () => {
    const buffer = fs.readFileSync(getShoplingOutboundTemplatePath());
    const error = validateShoplingOutboundTemplateFile(buffer);

    assert.equal(error, null);
  });

  it("rejects a workbook with insufficient header rows", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([["바코드", "출고수량"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

    const buffer = Buffer.from(
      XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
    );

    const error = validateShoplingOutboundTemplateFile(buffer);

    assert.ok(error);
    assert.match(error, /헤더 행 부족/);
  });

  it("rejects a sheet without barcode and quantity headers", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["이름", "코드"],
      ["설명", "설명"],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

    const buffer = Buffer.from(
      XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
    );

    const error = validateShoplingOutboundTemplateFile(buffer);

    assert.ok(error);
    assert.match(error, /바코드/);
  });
});

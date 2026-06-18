import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import {
  buildInboundTrendsFilename,
  formatTrendsDateHeader,
  generateInboundTrendsBuffer,
  getInboundTrendsSubHeaderLabels,
} from "@/lib/excel/generators/inbound-trends-export";
import type { InboundTrendsRowView } from "@/services/inbound-trends/types";

const sampleRow: InboundTrendsRowView = {
  rowKey: "1|abc",
  registeredProductName: "테스트 상품",
  optionName: "옵션 A",
  ptnGoodsCd: "PTN001",
  shoplingOptionValue: "레드",
  productBarcode: "1234567890",
  dateValues: {
    "2026-06-17": { coupang: 5, warehouse: null },
    "2026-06-16": { coupang: null, warehouse: 3 },
  },
};

describe("formatTrendsDateHeader", () => {
  it("formats ISO date as M/D", () => {
    assert.equal(formatTrendsDateHeader("2026-06-17"), "6/17");
  });
});

describe("getInboundTrendsSubHeaderLabels", () => {
  it("uses date sub-columns with (완) suffix", () => {
    assert.deepEqual(getInboundTrendsSubHeaderLabels(["2026-06-17"]), [
      "6/17(완)",
      "6/17",
    ]);
  });
});

describe("buildInboundTrendsFilename", () => {
  it("includes seller slug and date range", () => {
    assert.equal(
      buildInboundTrendsFilename("My Seller", "2026-06-01", "2026-06-17"),
      "추세조회_My_Seller_2026-06-01_2026-06-17.xlsx",
    );
  });
});

describe("generateInboundTrendsBuffer", () => {
  it("writes merged date headers and leaves missing quantities blank", async () => {
    const buffer = generateInboundTrendsBuffer([sampleRow], [
      "2026-06-17",
      "2026-06-16",
    ]);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets["추세조회"];

    assert.deepEqual(
      sheet["!merges"],
      [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
        { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
        { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },
        { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } },
        { s: { r: 0, c: 7 }, e: { r: 0, c: 8 } },
      ],
    );

    assert.equal(sheet.A1?.v, "상품명");
    assert.equal(sheet.F1?.v, "6/17");
    assert.equal(sheet.F2?.v, "6/17(완)");
    assert.equal(sheet.G2?.v, "6/17");
    assert.equal(sheet.A3?.v, "테스트 상품");
    assert.equal(sheet.F3?.v, 5);
    assert.equal(sheet.G3?.v, "");
    assert.equal(sheet.H3?.v, "");
    assert.equal(sheet.I3?.v, 3);
  });
});

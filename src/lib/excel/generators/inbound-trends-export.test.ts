import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import {
  buildInboundTrendsColumnKeys,
  buildInboundTrendsFilename,
  generateInboundTrendsBuffer,
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

describe("buildInboundTrendsColumnKeys", () => {
  it("uses flat headers with newest dates first", () => {
    assert.deepEqual(
      buildInboundTrendsColumnKeys(["2026-06-17", "2026-06-16"]),
      [
        "상품명",
        "옵션명",
        "자사상품코드",
        "샵플링 옵션 벨류",
        "바코드",
        "2026-06-17(완)",
        "2026-06-17",
        "2026-06-16(완)",
        "2026-06-16",
      ],
    );
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
  it("writes flat headers and leaves missing quantities blank", async () => {
    const buffer = generateInboundTrendsBuffer([sampleRow], [
      "2026-06-17",
      "2026-06-16",
    ]);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets["추세조회"];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
      sheet,
      { defval: "" },
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.["상품명"], "테스트 상품");
    assert.equal(rows[0]?.["2026-06-17(완)"], 5);
    assert.equal(rows[0]?.["2026-06-17"], "");
    assert.equal(rows[0]?.["2026-06-16(완)"], "");
    assert.equal(rows[0]?.["2026-06-16"], 3);
  });
});

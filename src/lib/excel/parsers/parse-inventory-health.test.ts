import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import { detectExcelTargetFromRows } from "@/lib/excel/detect-target";
import { parseInventoryHealthFromRows } from "@/lib/excel/parsers/parse-inventory-health";

const englishMainHeader = [
  "No.",
  "Inventory ID",
  "Option ID",
  "SKU ID",
  "Product name",
  "Option name",
  "Offer condition",
  "Orderable quantity (real-time)",
  "Pending inbounds (real-time)",
  "Item winner",
  "Recent sales (Excluding bundle sales)",
  null,
  "Recent sales quantity",
  null,
  "Recommended inbound\nquantity",
  "Recommended inbound date",
  "Days of cover",
  "Monthly storage fee",
  "Sku age (D-1)",
  null,
  null,
  null,
  null,
  null,
  "Customer returns last 30 days (D-1)",
  "Season",
  "Product listing date",
];

const englishSubHeader = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  "Last 7 days",
  "Last 30 days",
  "Last 7 days",
  "Last 30 days",
  null,
  null,
  null,
  null,
  "1~30 days",
  "31~45 days",
  "46~60 days",
  "61~120 days",
  "121~180 days",
  "181+ days",
  null,
  null,
  null,
];

const englishDataRow = [
  "1",
  "15428453444",
  "95304635718",
  "72693890",
  "Sample product",
  "Option A",
  "NEW",
  "306",
  "0",
  "Winner",
  "27250",
  "109000",
  "5",
  "20",
  "0",
  "",
  "70일 이내",
  "0",
  "300",
  "6",
  "0",
  "0",
  "0",
  "0",
  "1",
  "-",
  "2026-04-24",
];

const koreanMainHeader = [
  "No.",
  "등록상품 ID",
  "옵션 ID",
  "SKU ID",
  "등록상품명",
  "옵션명",
  "상품등급",
  "판매가능재고",
  "입고예정재고",
  "아이템위너",
  "최근 매출",
  null,
  "최근 판매수량",
  null,
  "추가입고 추천수량",
  "추가입고날짜",
  "재고예상 소진일",
  "누적보관료",
  "보관기간별",
  null,
  null,
  null,
  null,
  null,
  "고객반품 30일",
  "시즌관리",
  "상품등록일",
];

const koreanSubHeader = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  "지난 7일",
  "지난 30일",
  "지난 7일",
  "지난 30일",
  null,
  null,
  null,
  null,
  "1~30일",
  "31~45일",
  "46~60일",
  "61~120일",
  "121~180일",
  "181일+",
  null,
  null,
  null,
];

const koreanDataRow = [
  "1",
  "15428453444",
  "95304635718",
  "72693890",
  "샘플 상품",
  "옵션 A",
  "NEW",
  "306",
  "0",
  "아이템위너",
  "27250",
  "109000",
  "5",
  "20",
  "0",
  "",
  "70일 이내",
  "0",
  "300",
  "6",
  "0",
  "0",
  "0",
  "0",
  "1",
  "-",
  "2026-04-24",
];

describe("detectExcelTargetFromRows inventory health", () => {
  it("detects English inventory health headers", () => {
    const result = detectExcelTargetFromRows([englishMainHeader]);

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.targetId, "coupang_growth_inventory_health");
    }
  });

  it("detects Korean inventory health headers", () => {
    const result = detectExcelTargetFromRows([koreanMainHeader]);

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.targetId, "coupang_growth_inventory_health");
    }
  });
});

describe("parseInventoryHealthFromRows", () => {
  it("parses English headers and data rows", () => {
    const result = parseInventoryHealthFromRows([
      englishMainHeader,
      englishSubHeader,
      englishDataRow,
    ]);

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0]?.optionId, 95304635718n);
    assert.equal(result.rows[0]?.inventoryId, 15428453444n);
    assert.equal(result.rows[0]?.productName, "Sample product");
    assert.equal(result.rows[0]?.orderableQuantity, 306);
    assert.equal(result.rows[0]?.skuAge1_30, 300);
    assert.equal(result.rows[0]?.productListingDate?.toISOString(), "2026-04-24T00:00:00.000Z");
  });

  it("parses Korean headers and data rows", () => {
    const result = parseInventoryHealthFromRows([
      koreanMainHeader,
      koreanSubHeader,
      koreanDataRow,
    ]);

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0]?.optionId, 95304635718n);
    assert.equal(result.rows[0]?.productName, "샘플 상품");
    assert.equal(result.rows[0]?.orderableQuantity, 306);
  });
});

describe("parseInventoryHealth English xlsx file", () => {
  const filePath =
    "c:/Users/wwong/Downloads/inventory_health_sku_info_20260612140638.xlsx";

  it("parses the user English export file", { skip: !fs.existsSync(filePath) }, () => {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error("Missing sheet");
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, {
      header: 1,
      defval: null,
      raw: false,
    }) as unknown[][];

    const result = parseInventoryHealthFromRows(rows);

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.ok(result.rows.length > 300);
    assert.equal(typeof result.rows[0]?.optionId, "bigint");
  });
});

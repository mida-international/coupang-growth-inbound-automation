import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_COLUMN_ORDER,
  getDefaultColumnLayout,
  getVisibleColumnOrder,
  isColumnVisible,
  normalizeColumnLayout,
  type InboundWorkbenchColumnLayout,
} from "@/services/inbound-workbench/inbound-workbench-column-layout";

describe("normalizeColumnLayout", () => {
  it("returns defaults for empty input", () => {
    assert.deepEqual(normalizeColumnLayout(null), getDefaultColumnLayout());
    assert.deepEqual(
      normalizeColumnLayout(null).hiddenColumns,
      [],
    );
  });

  it("removes invalid column ids and appends missing columns", () => {
    const result = normalizeColumnLayout({
      columnOrder: ["invalid", "productBarcode", "registeredProductName"] as unknown as InboundWorkbenchColumnLayout["columnOrder"],
      columnWidths: {},
    });

    assert.deepEqual(result.columnOrder.slice(0, 3), [
      "productBarcode",
      "registeredProductName",
      "optionName",
    ]);
    assert.equal(result.columnOrder.length, DEFAULT_COLUMN_ORDER.length);
  });

  it("clamps column widths to minimum", () => {
    const result = normalizeColumnLayout({
      columnOrder: DEFAULT_COLUMN_ORDER,
      columnWidths: {
        productBarcode: 20,
        registeredProductName: 200,
      },
    });

    assert.equal(result.columnWidths.productBarcode, 64);
    assert.equal(result.columnWidths.registeredProductName, 200);
  });

  it("filters invalid hidden column ids and deduplicates", () => {
    const result = normalizeColumnLayout({
      columnOrder: DEFAULT_COLUMN_ORDER,
      hiddenColumns: [
        "invalid",
        "productBarcode",
        "productBarcode",
        "optionName",
      ] as unknown as InboundWorkbenchColumnLayout["hiddenColumns"],
    });

    assert.deepEqual(result.hiddenColumns, ["productBarcode", "optionName"]);
  });

  it("keeps at least one visible column when all would be hidden", () => {
    const result = normalizeColumnLayout({
      columnOrder: DEFAULT_COLUMN_ORDER,
      hiddenColumns: [...DEFAULT_COLUMN_ORDER],
    });

    assert.equal(result.hiddenColumns.length, DEFAULT_COLUMN_ORDER.length - 1);
    assert.ok(
      isColumnVisible(result, DEFAULT_COLUMN_ORDER[0]),
      "first column should remain visible",
    );
  });
});

describe("getVisibleColumnOrder", () => {
  it("excludes hidden columns while preserving order", () => {
    const layout = normalizeColumnLayout({
      columnOrder: DEFAULT_COLUMN_ORDER,
      hiddenColumns: ["productBarcode", "optionName"],
    });

    assert.deepEqual(getVisibleColumnOrder(layout), [
      "registeredProductName",
      "shoplingAvailableStock",
      "ptnGoodsCd",
      "orderableQuantity",
      "salesQty60days",
      "recentSalesQty7days",
      "recentSalesQty30days",
      "recommendedInboundQty",
      "pendingInbounds",
      "safetyStock",
      "growthInboundRecommend",
      "actualPackedQty",
      "rotation1Qty",
      "rotation2Qty",
      "rotation3Qty",
      "offerCondition",
      "daysOfCover",
      "location",
    ]);
  });
});

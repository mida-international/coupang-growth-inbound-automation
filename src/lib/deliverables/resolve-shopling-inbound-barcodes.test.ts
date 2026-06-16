import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShoplingInboundLookupKey,
  normalizeShoplingInboundOption,
} from "@/lib/deliverables/normalize-shopling-inbound-option";
import { resolveShoplingInboundBarcodes } from "@/lib/deliverables/resolve-shopling-inbound-barcodes";

describe("normalizeShoplingInboundOption", () => {
  it("normalizes fullwidth commas and spaces", () => {
    assert.equal(normalizeShoplingInboundOption("白色，20*30"), "白色,20*30");
    assert.equal(normalizeShoplingInboundOption("白色, 20*30"), "白色,20*30");
  });

  it("builds stable lookup keys", () => {
    assert.equal(
      buildShoplingInboundLookupKey("气泡袋", "白色，20*30"),
      buildShoplingInboundLookupKey("气泡袋", "白色,20*30"),
    );
  });
});

describe("resolveShoplingInboundBarcodes", () => {
  const inventoryRows = [
    {
      ptnGoodsCd: "CODE-001",
      productName: "气泡袋",
      optionValue: "白色,20*30",
      barcode: "8801111111111",
    },
    {
      ptnGoodsCd: "CODE-002",
      productName: "테이프",
      optionValue: "단품",
      barcode: "8802222222222",
    },
  ];

  it("matches by product name when ptn goods code differs from the inbound list label", () => {
    const result = resolveShoplingInboundBarcodes(
      [{ ptnGoodsCd: "气泡袋", optionValue: "白色，20*30", quantity: 10 }],
      inventoryRows,
    );

    assert.deepEqual(result.rows, [
      { barcode: "8801111111111", deductQty: 10 },
    ]);
    assert.equal(result.unmapped.length, 0);
  });

  it("matches by ptn goods code", () => {
    const result = resolveShoplingInboundBarcodes(
      [{ ptnGoodsCd: "CODE-002", optionValue: "단품", quantity: 3 }],
      inventoryRows,
    );

    assert.deepEqual(result.rows, [
      { barcode: "8802222222222", deductQty: 3 },
    ]);
  });

  it("returns partial rows and tracks unmapped items", () => {
    const result = resolveShoplingInboundBarcodes(
      [
        { ptnGoodsCd: "气泡袋", optionValue: "白色，20*30", quantity: 2 },
        { ptnGoodsCd: "없는상품", optionValue: "옵션", quantity: 1 },
      ],
      inventoryRows,
    );

    assert.equal(result.rows.length, 1);
    assert.equal(result.unmapped.length, 1);
  });
});

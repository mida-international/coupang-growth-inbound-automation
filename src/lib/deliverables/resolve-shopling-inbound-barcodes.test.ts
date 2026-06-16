import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findBarcodesByOptionCascade,
  matchShoplingInboundInventoryRow,
  resolveShoplingInboundBarcodes,
} from "@/lib/deliverables/resolve-shopling-inbound-barcodes";

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
    {
      ptnGoodsCd: "CODE-003",
      productName: "라벨",
      optionValue: "redlarge",
      barcode: "8803333333333",
    },
  ];

  it("matches by product name at exact option tier", () => {
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

  it("matches at ignoreWhitespace tier when spaces differ", () => {
    const result = resolveShoplingInboundBarcodes(
      [{ ptnGoodsCd: "气泡袋", optionValue: "白色, 20 * 30", quantity: 4 }],
      inventoryRows,
    );

    assert.deepEqual(result.rows, [
      { barcode: "8801111111111", deductQty: 4 },
    ]);
  });

  it("matches at ignoreCase tier when only casing differs", () => {
    const result = resolveShoplingInboundBarcodes(
      [{ ptnGoodsCd: "라벨", optionValue: "Red Large", quantity: 7 }],
      inventoryRows,
    );

    assert.deepEqual(result.rows, [
      { barcode: "8803333333333", deductQty: 7 },
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

  it("marks ambiguous when multiple barcodes match at the same tier", () => {
    const ambiguousRows = [
      {
        ptnGoodsCd: "CODE-X",
        productName: "상품",
        optionValue: "Red",
        barcode: "8804444444444",
      },
      {
        ptnGoodsCd: "CODE-X",
        productName: "상품",
        optionValue: "red",
        barcode: "8805555555555",
      },
    ];

    const result = resolveShoplingInboundBarcodes(
      [{ ptnGoodsCd: "상품", optionValue: "RED", quantity: 1 }],
      ambiguousRows,
    );

    assert.equal(result.rows.length, 0);
    assert.equal(result.ambiguous.length, 1);
  });

  it("keeps duplicate barcodes as separate rows in list order", () => {
    const result = resolveShoplingInboundBarcodes(
      [
        { ptnGoodsCd: "气泡袋", optionValue: "白色，20*30", quantity: 10 },
        { ptnGoodsCd: "气泡袋", optionValue: "白色，20*30", quantity: 5 },
        { ptnGoodsCd: "테이프", optionValue: "단품", quantity: 3 },
      ],
      inventoryRows,
    );

    assert.deepEqual(result.rows, [
      { barcode: "8801111111111", deductQty: 10 },
      { barcode: "8801111111111", deductQty: 5 },
      { barcode: "8802222222222", deductQty: 3 },
    ]);
  });
});

describe("findBarcodesByOptionCascade", () => {
  it("stops at the first tier with a single barcode match", () => {
    const candidates = [
      {
        ptnGoodsCd: "A",
        productName: "상품",
        optionValue: "白色,20*30",
        barcode: "8801111111111",
      },
    ];

    const match = findBarcodesByOptionCascade(candidates, "白色, 20 * 30");

    assert.equal(match.status, "matched");
    if (match.status === "matched") {
      assert.equal(match.barcode, "8801111111111");
    }
  });
});

describe("matchShoplingInboundInventoryRow", () => {
  it("returns matched with barcode when location is null", () => {
    const match = matchShoplingInboundInventoryRow(
      "气泡袋",
      "白色，20*30",
      [
        {
          ptnGoodsCd: "CODE-001",
          productName: "气泡袋",
          optionValue: "白色,20*30",
          barcode: "8801111111111",
          location: null,
        },
      ],
    );

    assert.equal(match.status, "matched");
    if (match.status === "matched") {
      assert.equal(match.barcode, "8801111111111");
      assert.equal(match.location, null);
    }
  });

  it("returns location when available", () => {
    const match = matchShoplingInboundInventoryRow(
      "테이프",
      "단품",
      [
        {
          ptnGoodsCd: "CODE-002",
          productName: "테이프",
          optionValue: "단품",
          barcode: "8802222222222",
          location: "A-01",
        },
      ],
    );

    assert.equal(match.status, "matched");
    if (match.status === "matched") {
      assert.equal(match.barcode, "8802222222222");
      assert.equal(match.location, "A-01");
    }
  });
});

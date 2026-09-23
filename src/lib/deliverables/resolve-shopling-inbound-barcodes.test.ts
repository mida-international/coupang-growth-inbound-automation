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

  it("matches zero-quantity rows for validation but excludes them from output rows", () => {
    const result = resolveShoplingInboundBarcodes(
      [
        { ptnGoodsCd: "气泡袋", optionValue: "白色，20*30", quantity: 0 },
        { ptnGoodsCd: "테이프", optionValue: "단품", quantity: 3 },
      ],
      inventoryRows,
    );

    assert.deepEqual(result.rows, [
      { barcode: "8802222222222", deductQty: 3 },
    ]);
    assert.equal(result.validation.length, 2);
    assert.deepEqual(result.validation[0], {
      ptnGoodsCd: "气泡袋",
      optionValue: "白色，20*30",
      quantity: 0,
      status: "matched",
      barcode: "8801111111111",
    });
    assert.equal(result.unmapped.length, 0);
  });

  it("collects per-row validation results in input order", () => {
    const result = resolveShoplingInboundBarcodes(
      [
        { ptnGoodsCd: "气泡袋", optionValue: "白色，20*30", quantity: 2 },
        { ptnGoodsCd: "없는상품", optionValue: "옵션", quantity: 1 },
      ],
      inventoryRows,
    );

    assert.deepEqual(result.validation, [
      {
        ptnGoodsCd: "气泡袋",
        optionValue: "白色，20*30",
        quantity: 2,
        status: "matched",
        barcode: "8801111111111",
      },
      {
        ptnGoodsCd: "없는상품",
        optionValue: "옵션",
        quantity: 1,
        status: "unmapped",
        barcode: null,
        unmappedReason: "productNotFound",
        candidateOptions: [],
      },
    ]);
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

describe("matchShoplingInboundInventoryRow — 상품명 공백·대소문자 무시와 실패 사유", () => {
  const row = (
    ptnGoodsCd: string,
    optionValue: string,
    barcode: string,
  ) => ({ ptnGoodsCd, productName: null, optionValue, barcode, location: "loc" });

  const inventory = [
    row("먼지차단립스틱정리함", "1개 뚜껑있음18칸", "2016341223426"),
    row("먼지차단립스틱정리함", "1개 뚜껑없음18칸", "2016341223433"),
    row("실리콘어깨끈패드", "검정", "2016341385773"),
    row("실리콘어깨끈패드", "베이지", "2016341385780"),
    row("PET자연스티커", "02.잎사귀", "2000337636888"),
    row("나비집게핀_RM", "화이트+퍼플", "2000337831603"),
  ];

  const expectMatch = (product: string, option: string, barcode: string) => {
    const match = matchShoplingInboundInventoryRow(product, option, inventory);
    assert.equal(match.status, "matched");
    if (match.status === "matched") {
      assert.equal(match.barcode, barcode);
    }
  };

  const expectOptionNotFound = (product: string, option: string, candidates: string[]) => {
    const match = matchShoplingInboundInventoryRow(product, option, inventory);
    assert.equal(match.status, "unmapped");
    if (match.status === "unmapped") {
      assert.equal(match.reason, "optionNotFound");
      assert.deepEqual(match.candidateOptions, candidates);
    }
  };

  it("matches product names that differ only in spacing", () => {
    expectMatch("먼지차단 립스틱정리함", "1개 뚜껑있음18칸", "2016341223426");
  });

  it("matches product names that differ only in casing", () => {
    expectMatch("pet자연스티커", "02.잎사귀", "2000337636888");
  });

  it("matches options that differ only in spacing", () => {
    expectMatch("먼지차단립스틱정리함", "1개뚜껑있음18칸", "2016341223426");
  });

  it("does not guess when the option has extra or missing words", () => {
    // 샵플링 옵션이 "1개 뚜껑있음18칸" 이면 "뚜껑있음18칸" 은 매칭하지 않고 후보를 보여준다.
    expectOptionNotFound("먼지차단립스틱정리함", "뚜껑있음18칸", [
      "1개 뚜껑있음18칸",
      "1개 뚜껑없음18칸",
    ]);
    expectOptionNotFound("실리콘어깨끈패드", "검정-옵션추가", ["검정", "베이지"]);
  });

  it("does not strip product suffixes like _RM", () => {
    const match = matchShoplingInboundInventoryRow("나비집게핀", "화이트+퍼플", inventory);
    assert.equal(match.status, "unmapped");
    if (match.status === "unmapped") {
      assert.equal(match.reason, "productNotFound");
    }
  });
});

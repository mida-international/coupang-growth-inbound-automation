import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  expandProductOptions,
  type FlatOptionArrays,
  type OptListEntry,
} from "@/lib/shopling/expand-product-options";
import { parseShoplingProductsFromXml } from "@/lib/shopling/parse-product-rows";

function makeFlat(overrides: Partial<FlatOptionArrays> = {}): FlatOptionArrays {
  return {
    optBarcode: [],
    optId: [],
    optQty: [],
    optVrtlQty: [],
    optPrice: [],
    optSupplyPrice: [],
    optStatus: [],
    optStoreMemo: [],
    ...overrides,
  };
}

function wrapGoodsInfo(inner: string): string {
  return `<goodsInfo>${inner}</goodsInfo>`;
}

describe("expandProductOptions", () => {
  it("case A: single option row", () => {
    const optLists: OptListEntry[] = [{ title: "단품", valueParts: ["단품"] }];
    const flat = makeFlat({
      optBarcode: ["880111"],
      optQty: [50],
    });

    const rows = expandProductOptions(optLists, flat, true);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.optionTitle, "단품");
    assert.equal(rows[0]?.optionValue, "단품");
    assert.equal(rows[0]?.barcode, "880111");
    assert.equal(rows[0]?.availableStock, 50);
  });

  it("case B: one axis with multiple values", () => {
    const optLists: OptListEntry[] = [
      { title: "색상", valueParts: ["파랑", "검정"] },
    ];
    const flat = makeFlat({
      optBarcode: ["880111", "880222"],
      optQty: [50, 30],
    });

    const rows = expandProductOptions(optLists, flat, true);

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.optionTitle, "색상");
    assert.equal(rows[0]?.optionValue, "파랑");
    assert.equal(rows[0]?.barcode, "880111");
    assert.equal(rows[1]?.optionValue, "검정");
    assert.equal(rows[1]?.availableStock, 30);
  });

  it("case C: cartesian product for two axes", () => {
    const optLists: OptListEntry[] = [
      { title: "색상", valueParts: ["파랑", "검정"] },
      { title: "사이즈", valueParts: ["L", "M"] },
    ];
    const flat = makeFlat({
      optBarcode: ["8801", "8802", "8803", "8804"],
      optQty: [50, 51, 52, 53],
    });

    const rows = expandProductOptions(optLists, flat, true);

    assert.equal(rows.length, 4);
    assert.equal(rows[0]?.optionTitle, "색상, 사이즈");
    assert.equal(rows[0]?.optionValue, "파랑, L");
    assert.equal(rows[1]?.optionValue, "파랑, M");
    assert.equal(rows[2]?.optionValue, "검정, L");
    assert.equal(rows[3]?.optionValue, "검정, M");
    assert.equal(rows[3]?.availableStock, 53);
  });

  it("case D: cartesian mismatch fallback", () => {
    const optLists: OptListEntry[] = [
      { title: "색상", valueParts: ["파랑", "검정"] },
      { title: "사이즈", valueParts: ["L", "M"] },
    ];
    const flat = makeFlat({
      optBarcode: ["b0", "b1", "b2"],
      optQty: [1, 2, 3],
    });

    const rows = expandProductOptions(optLists, flat, true);

    assert.equal(rows.length, 3);
    assert.equal(rows[0]?.optionTitle, "색상, 사이즈");
    assert.equal(rows[0]?.optionValue, "옵션1");
    assert.equal(rows[2]?.optionValue, "옵션3");
    assert.equal(rows[2]?.barcode, "b2");
  });
});

describe("parseShoplingProductsFromXml", () => {
  it("parses goodsInfo block with options", () => {
    const xml = wrapGoodsInfo(`
      <goods_key>100051</goods_key>
      <ptn_goods_cd>P001</ptn_goods_cd>
      <prod_nm>테스트상품</prod_nm>
      <options>
        <optList><title>단품</title><value>단품</value></optList>
        <optBarcode>880111</optBarcode>
        <optQty>50</optQty>
      </options>
    `);

    const rows = parseShoplingProductsFromXml(xml);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.goodsKey, "100051");
    assert.equal(rows[0]?.productName, "테스트상품");
    assert.equal(rows[0]?.optionValue, "단품");
  });
});

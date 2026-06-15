import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseShoplingPackageMappingsFromXml } from "@/lib/shopling/parse-package-mappings";

const PLAN_EXAMPLE_XML = `
<goodsInfo>
  <goods_key>100051</goods_key>
  <ptn_goods_cd><![CDATA[헤어핀_2P세트]]></ptn_goods_cd>
  <prod_nm><![CDATA[볼륨 헤어핀 세트]]></prod_nm>
  <goods_tp>S</goods_tp>
  <options>
    <optList><title>수량</title><value>2P,4P</value></optList>
    <optId>111,222</optId>
    <optBarcode>880PKG1,880PKG2</optBarcode>
    <optQty>50,30</optQty>
  </options>
  <pkgOptMappings>
    <pkgOptMap>
      <optId>111</optId>
      <pkgTitle>스펀지형+찍찍이형</pkgTitle>
      <pkgItems>
        <pkgItem>
          <optId>333</optId>
          <optValue>스펀지형</optValue>
          <mapCnt>2</mapCnt>
        </pkgItem>
        <pkgItem>
          <optId>444</optId>
          <optValue>찍찍이형</optValue>
          <mapCnt>1</mapCnt>
        </pkgItem>
      </pkgItems>
    </pkgOptMap>
  </pkgOptMappings>
</goodsInfo>
`;

function wrapGoodsInfo(inner: string): string {
  return `<goodsInfo>${inner}</goodsInfo>`;
}

describe("parseShoplingPackageMappingsFromXml", () => {
  it("parses plan example into two rows with map_cnt 2 and 1", () => {
    const rows = parseShoplingPackageMappingsFromXml(PLAN_EXAMPLE_XML);

    assert.equal(rows.length, 2);

    const row1 = rows[0]!;
    assert.equal(row1.packageGoodsKey, "100051");
    assert.equal(row1.packagePtnGoodsCd, "헤어핀_2P세트");
    assert.equal(row1.packageOptValue, "2P");
    assert.equal(row1.packageBarcode, "880PKG1");
    assert.equal(row1.packageOptId, "111");
    assert.equal(row1.singleOptValue, "스펀지형");
    assert.equal(row1.singleOptId, "333");
    assert.equal(row1.mapCnt, 2);

    const row2 = rows[1]!;
    assert.equal(row2.packagePtnGoodsCd, "헤어핀_2P세트");
    assert.equal(row2.packageOptValue, "2P");
    assert.equal(row2.packageBarcode, "880PKG1");
    assert.equal(row2.packageOptId, "111");
    assert.equal(row2.singleOptValue, "찍찍이형");
    assert.equal(row2.singleOptId, "444");
    assert.equal(row2.mapCnt, 1);
  });

  it("returns empty when goodsInfo has no pkgOptMappings", () => {
    const xml = wrapGoodsInfo(`
      <goods_key>999</goods_key>
      <ptn_goods_cd>TEST</ptn_goods_cd>
      <options>
        <optId>1</optId>
        <optBarcode>880</optBarcode>
      </options>
    `);

    const rows = parseShoplingPackageMappingsFromXml(xml);

    assert.deepEqual(rows, []);
  });

  it("defaults mapCnt to 1 when mapCnt tag is missing", () => {
    const xml = wrapGoodsInfo(`
      <goods_key>100</goods_key>
      <ptn_goods_cd>PKG</ptn_goods_cd>
      <options>
        <optList><title>수량</title><value>2P</value></optList>
        <optId>111</optId>
        <optBarcode>880PKG1</optBarcode>
        <optQty>50</optQty>
      </options>
      <pkgOptMappings>
        <pkgOptMap>
          <optId>111</optId>
          <pkgItems>
            <pkgItem>
              <optId>333</optId>
              <optValue>단품A</optValue>
            </pkgItem>
          </pkgItems>
        </pkgOptMap>
      </pkgOptMappings>
    `);

    const rows = parseShoplingPackageMappingsFromXml(xml);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.mapCnt, 1);
  });

  it("returns null packageOptValue and barcode when package opt id is unknown", () => {
    const xml = wrapGoodsInfo(`
      <goods_key>100</goods_key>
      <ptn_goods_cd>PKG</ptn_goods_cd>
      <options>
        <optList><title>수량</title><value>2P</value></optList>
        <optId>111</optId>
        <optBarcode>880PKG1</optBarcode>
      </options>
      <pkgOptMappings>
        <pkgOptMap>
          <optId>999</optId>
          <pkgItems>
            <pkgItem>
              <optId>333</optId>
              <optValue>단품A</optValue>
              <mapCnt>1</mapCnt>
            </pkgItem>
          </pkgItems>
        </pkgOptMap>
      </pkgOptMappings>
    `);

    const rows = parseShoplingPackageMappingsFromXml(xml);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.packageOptId, "999");
    assert.equal(rows[0]?.packageOptValue, null);
    assert.equal(rows[0]?.packageBarcode, null);
  });
});

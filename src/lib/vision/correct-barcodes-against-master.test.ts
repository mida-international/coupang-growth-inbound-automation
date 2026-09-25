import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  correctVisionBarcodesAgainstMaster,
  normalizeText,
  type MasterBarcodeIndex,
  type MasterEntry,
} from "@/lib/vision/correct-barcodes-against-master";

function buildIndex(
  rows: { name: string; option: string; barcode: string }[],
): MasterBarcodeIndex {
  const entries: MasterEntry[] = rows.map((r) => ({
    name: normalizeText(r.name),
    option: normalizeText(r.option),
    barcode: r.barcode,
  }));
  const barcodeSet = new Set(rows.map((r) => r.barcode));
  const byNameOption = new Map<string, string>();
  const seen = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const e of entries) {
    const key = `${e.name}${e.option}`;
    const prev = seen.get(key);
    if (prev === undefined) seen.set(key, e.barcode);
    else if (prev !== e.barcode) ambiguous.add(key);
  }
  for (const [k, v] of seen) if (!ambiguous.has(k)) byNameOption.set(k, v);
  return { barcodeSet, byNameOption, entries };
}

const MASTER = buildIndex([
  { name: "자동차가방포켓", option: "1개 레드", barcode: "2000333358500" },
  { name: "자동차가방포켓_RM", option: "2개 레드", barcode: "2016342582096" },
  { name: "레자유모차핸들커버", option: "브라운 1개", barcode: "2016342610669" },
  { name: "컬링헤어브러쉬", option: "1개 그린", barcode: "2016342337993" },
]);

function makeVision(rows: Record<string, string>[]) {
  return {
    columns: ["date", "location", "등록상품명", "옵션", "바코드", "수량", "가용"],
    rows,
  };
}

describe("correctVisionBarcodesAgainstMaster", () => {
  it("OCR이 한 자리 빠뜨린 바코드를 상품명+옵션으로 교정한다", () => {
    // 실제 사례: 2000333358500 -> 200033358500(한 자리 빠짐), 상품명도 '가' 빠짐
    const { visionData, corrections } = correctVisionBarcodesAgainstMaster(
      makeVision([
        { 등록상품명: "자동차방포켓", 옵션: "1개 레드", 바코드: "200033358500", 수량: "2" },
      ]),
      MASTER,
    );
    assert.equal(visionData.rows[0]["바코드"], "2000333358500");
    assert.equal(corrections.length, 1);
    assert.equal(corrections[0].to, "2000333358500");
  });

  it("이미 올바른 바코드는 그대로 둔다", () => {
    const { visionData, corrections } = correctVisionBarcodesAgainstMaster(
      makeVision([
        { 등록상품명: "컬링헤어브러쉬", 옵션: "1개 그린", 바코드: "2016342337993", 수량: "1" },
      ]),
      MASTER,
    );
    assert.equal(visionData.rows[0]["바코드"], "2016342337993");
    assert.equal(corrections.length, 0);
  });

  it("상품명/옵션이 마스터와 안 맞으면 함부로 교정하지 않는다", () => {
    const { visionData, corrections } = correctVisionBarcodesAgainstMaster(
      makeVision([
        { 등록상품명: "전혀다른상품명XYZ", 옵션: "없는옵션", 바코드: "9999999999999", 수량: "1" },
      ]),
      MASTER,
    );
    assert.equal(visionData.rows[0]["바코드"], "9999999999999");
    assert.equal(corrections.length, 0);
  });

  it("옵션이 다르면 같은 상품명이라도 올바른 바코드로 구분한다", () => {
    const { visionData } = correctVisionBarcodesAgainstMaster(
      makeVision([
        // 바코드가 틀렸지만 옵션이 '2개 레드' → _RM 바코드로 교정되어야
        { 등록상품명: "자동차가방포켓_RM", 옵션: "2개 레드", 바코드: "2016342582000", 수량: "2" },
      ]),
      MASTER,
    );
    assert.equal(visionData.rows[0]["바코드"], "2016342582096");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";

import { parseArbitrationResponse } from "@/lib/vision/extract-with-claude";
import {
  computeStripBounds,
  prepareVisionImages,
} from "@/lib/vision/prepare-vision-images";
import {
  applyArbitration,
  DISPUTED_ROW_CONFIDENCE,
  reconcileVisionRows,
} from "@/lib/vision/reconcile-vision-results";

function row(barcode: string, qty: string, name = "상품"): Record<string, string> {
  return { 등록상품명: name, 바코드: barcode, 수량: qty, confidence: "0.95" };
}

describe("reconcileVisionRows", () => {
  it("accepts rows where both readings agree", () => {
    const result = reconcileVisionRows(
      [row("111", "2"), row("222", "5")],
      [row("111", "2"), row("222", "5")],
    );

    assert.equal(result.disputes.length, 0);
    assert.deepEqual(applyArbitration(result, []), [row("111", "2"), row("222", "5")]);
  });

  it("disputes a quantity mismatch and applies the arbitration result", () => {
    // 실제 사례: 인쇄 수량 2 를 한쪽 모델이 5 로 읽음
    const result = reconcileVisionRows(
      [row("2016342655202", "5", "복고동글이안경")],
      [row("2016342655202", "2", "복고동글이안경")],
    );

    assert.equal(result.disputes.length, 1);
    assert.equal(result.disputes[0].a?.["수량"], "5");
    assert.equal(result.disputes[0].b?.["수량"], "2");

    const rows = applyArbitration(result, [
      { id: "d1", exists: true, 바코드: "2016342655202", 수량: "2", printedQty: "" },
    ]);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]["수량"], "2");
    assert.equal(rows[0]["등록상품명"], "복고동글이안경");
    assert.equal(rows[0].confidence, DISPUTED_ROW_CONFIDENCE);
  });

  it("keeps the primary reading flagged when arbitration fails", () => {
    const result = reconcileVisionRows([row("111", "5")], [row("111", "2")]);
    const rows = applyArbitration(result, []);

    assert.equal(rows[0]["수량"], "5");
    assert.equal(rows[0].confidence, DISPUTED_ROW_CONFIDENCE);
  });

  it("inserts rows found only by the secondary reading after their predecessor", () => {
    const result = reconcileVisionRows(
      [row("111", "1"), row("333", "3")],
      [row("111", "1"), row("222", "2"), row("333", "3")],
    );

    assert.equal(result.disputes.length, 1);
    assert.equal(result.disputes[0].a, null);

    const rows = applyArbitration(result, [
      { id: "d1", exists: true, 바코드: "222", 수량: "2", printedQty: "" },
    ]);

    assert.deepEqual(
      rows.map((item) => item["바코드"]),
      ["111", "222", "333"],
    );
  });

  it("merges a misread-barcode pair into a single row", () => {
    const result = reconcileVisionRows([row("880005", "3")], [row("880006", "3")]);

    assert.equal(result.disputes.length, 2);

    const rows = applyArbitration(result, [
      { id: "d1", exists: true, 바코드: "880005", 수량: "3", printedQty: "" },
      { id: "d2", exists: false, 바코드: "880006", 수량: "3", printedQty: "" },
    ]);

    assert.deepEqual(rows.map((item) => item["바코드"]), ["880005"]);
  });

  it("matches duplicated barcodes by occurrence order", () => {
    const result = reconcileVisionRows(
      [row("111", "1"), row("111", "4")],
      [row("111", "1"), row("111", "4")],
    );

    assert.equal(result.disputes.length, 0);
  });
});

describe("parseArbitrationResponse", () => {
  it("parses decisions and normalizes fields", () => {
    const decisions = parseArbitrationResponse(
      '설명 {"decisions":[{"id":"d1","exists":true,"바코드":"2016 342655202","수량":"2","printedQty":""}]}',
    );

    assert.deepEqual(decisions, [
      { id: "d1", exists: true, 바코드: "2016342655202", 수량: "2", printedQty: "" },
    ]);
  });
});

describe("prepareVisionImages", () => {
  it("computes overlapping strips that cover the whole page", () => {
    const strips = computeStripBounds(1350, 3, 0.12);

    assert.equal(strips.length, 3);
    assert.equal(strips[0].top, 0);
    assert.equal(strips[2].top + strips[2].height, 1350);
    assert.ok(strips[1].top < strips[0].top + strips[0].height);
  });

  it("returns a full page and enlarged strips", async () => {
    const buffer = await sharp({
      create: { width: 944, height: 1350, channels: 3, background: "#ffffff" },
    })
      .png()
      .toBuffer();

    const prepared = await prepareVisionImages(buffer);
    const fullMeta = await sharp(Buffer.from(prepared.full.base64, "base64")).metadata();
    const stripMeta = await sharp(Buffer.from(prepared.strips[0].base64, "base64")).metadata();

    assert.equal(prepared.strips.length, 3);
    assert.equal(fullMeta.width, 944);
    assert.equal(stripMeta.width, 2576);
  });
});

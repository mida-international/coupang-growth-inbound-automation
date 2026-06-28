import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { convertVisionDataToBoxItems } from "@/lib/vision/convert-vision-to-box-items";
import { computeVisionStats } from "@/lib/vision/compute-vision-stats";
import { parseVisionJsonResponse } from "@/lib/vision/parse-vision-json";
import { mergeVisionPayloads } from "@/lib/vision/merge-vision-results";

describe("parseVisionJsonResponse", () => {
  it("parses JSON and normalizes rows", () => {
    const result = parseVisionJsonResponse(`{
      "columns": ["바코드", "가용", "수량"],
      "rows": [
        { "바코드": "2016340979072", "가용": "0", "수량": "7", "confidence": "0.95" }
      ],
      "metadata": { "boxNumbers": ["박스 - 14"] }
    }`);

    assert.equal(result.rows[0]["바코드"], "2016340979072");
    assert.equal(result.metadata?.boxNumbers?.[0], "박스 - 14");
  });

  it("strips markdown fences", () => {
    const result = parseVisionJsonResponse(
      '```json\n{"columns":["바코드"],"rows":[{"바코드":"1234567890123","가용":"2"}]}\n```',
    );

    assert.equal(result.rows[0]["바코드"], "1234567890123");
  });
});

describe("convertVisionDataToBoxItems", () => {
  it("uses 수량 (가용 is left empty by the new correction rule)", () => {
    const { items } = convertVisionDataToBoxItems({
      columns: ["바코드", "수량", "가용"],
      rows: [
        {
          바코드: "2016340979072",
          수량: "0", // 보정된 값이 수량에 들어옴 (가용은 비움)
          가용: "",
          confidence: "0.9",
        },
      ],
    });

    assert.equal(items.length, 1);
    assert.equal(items[0].quantity, 0);
  });

  it("uses 수량 when 가용 is absent", () => {
    const { items } = convertVisionDataToBoxItems({
      columns: ["바코드", "수량"],
      rows: [{ 바코드: "2016340979072", 수량: "3" }],
    });

    assert.equal(items[0].quantity, 3);
  });
});

describe("mergeVisionPayloads", () => {
  it("merges rows from multiple payloads", () => {
    const merged = mergeVisionPayloads([
      {
        columns: ["바코드", "수량"],
        rows: [{ 바코드: "1111111111111", 수량: "1" }],
      },
      {
        columns: ["바코드", "수량"],
        rows: [{ 바코드: "2222222222222", 수량: "2" }],
        metadata: { boxNumbers: ["박스 - 15"] },
      },
    ]);

    assert.equal(merged.rows.length, 2);
    assert.deepEqual(merged.boxNumbers, ["박스 - 15"]);
  });
});

describe("computeVisionStats", () => {
  it("counts corrections when 가용 differs from 수량", () => {
    const stats = computeVisionStats(
      {
        columns: ["바코드", "수량", "가용"],
        rows: [
          { 바코드: "2016340979072", 수량: "7", 가용: "4" },
          { 바코드: "2016342453259", 수량: "9", 가용: "0" },
        ],
      },
      { imageCount: 1, boxNumbers: ["박스 - 14"] },
    );

    assert.equal(stats.correctionCount, 2);
    assert.equal(stats.validBarcodeRows, 2);
  });
});

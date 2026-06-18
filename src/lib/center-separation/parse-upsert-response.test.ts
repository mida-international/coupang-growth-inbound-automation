import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseCenterSeparationUpsertResponse } from "@/lib/center-separation/parse-upsert-response";

describe("parseCenterSeparationUpsertResponse", () => {
  it("parses existingBarcodes from success responses", () => {
    const result = parseCenterSeparationUpsertResponse({
      ok: true,
      data: {
        stats: {
          inputRows: 2,
          upserted: 1,
          created: 1,
          updated: 0,
          skippedEmptyBarcode: 0,
          errors: [],
        },
        missingBarcodes: ["8802"],
        existingBarcodes: ["8803"],
      },
    });

    assert.equal(result?.ok, true);

    if (result?.ok) {
      assert.deepEqual(result.data.existingBarcodes, ["8803"]);
      assert.deepEqual(result.data.missingBarcodes, ["8802"]);
    }
  });

  it("parses existingBarcodes from error responses", () => {
    const result = parseCenterSeparationUpsertResponse({
      ok: false,
      error: "이미 등록된 바코드입니다.",
      missingBarcodes: [],
      existingBarcodes: ["8801111111111"],
    });

    assert.equal(result?.ok, false);

    if (result && !result.ok) {
      assert.deepEqual(result.existingBarcodes, ["8801111111111"]);
    }
  });
});

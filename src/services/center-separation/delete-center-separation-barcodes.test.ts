import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deleteCenterSeparationBarcodes } from "@/services/center-separation/delete-center-separation-barcodes";

describe("deleteCenterSeparationBarcodes", () => {
  it("rejects empty ids", async () => {
    const result = await deleteCenterSeparationBarcodes([]);

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.match(result.error, /삭제할 항목을 선택해 주세요/);
    }
  });

  it("rejects whitespace-only ids", async () => {
    const result = await deleteCenterSeparationBarcodes(["  ", ""]);

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.match(result.error, /삭제할 항목을 선택해 주세요/);
    }
  });
});

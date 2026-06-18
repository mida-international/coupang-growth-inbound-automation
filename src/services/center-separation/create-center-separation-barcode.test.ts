import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createCenterSeparationBarcode } from "@/services/center-separation/create-center-separation-barcode";

describe("createCenterSeparationBarcode", () => {
  it("rejects empty barcode", async () => {
    const result = await createCenterSeparationBarcode("   ");

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.match(result.error, /바코드를 입력해 주세요/);
    }
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { partitionCenterSeparationBarcodes } from "@/services/center-separation/partition-center-separation-barcodes";

describe("partitionCenterSeparationBarcodes", () => {
  it("splits known and missing barcodes in input order", () => {
    const result = partitionCenterSeparationBarcodes(
      ["8801", "8802", "8803"],
      new Set(["8801", "8803"]),
    );

    assert.deepEqual(result.knownBarcodes, ["8801", "8803"]);
    assert.deepEqual(result.missingBarcodes, ["8802"]);
  });

  it("deduplicates repeated barcodes while preserving first occurrence order", () => {
    const result = partitionCenterSeparationBarcodes(
      ["8801", "8801", "8802", "8802"],
      new Set(["8802"]),
    );

    assert.deepEqual(result.knownBarcodes, ["8802"]);
    assert.deepEqual(result.missingBarcodes, ["8801"]);
  });

  it("ignores empty barcodes", () => {
    const result = partitionCenterSeparationBarcodes(
      ["", "  ", "8801"],
      new Set(["8801"]),
    );

    assert.deepEqual(result.knownBarcodes, ["8801"]);
    assert.deepEqual(result.missingBarcodes, []);
  });
});

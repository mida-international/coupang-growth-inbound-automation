import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { partitionKnownBarcodesByExisting } from "@/services/center-separation/partition-known-barcodes-by-existing";

describe("partitionKnownBarcodesByExisting", () => {
  it("splits known barcodes into create and existing lists", () => {
    const result = partitionKnownBarcodesByExisting(
      ["8801", "8802", "8803"],
      new Set(["8802"]),
    );

    assert.deepEqual(result.toCreate, ["8801", "8803"]);
    assert.deepEqual(result.existingBarcodes, ["8802"]);
  });

  it("returns all barcodes as existing when every barcode is already registered", () => {
    const result = partitionKnownBarcodesByExisting(
      ["8801", "8802"],
      new Set(["8801", "8802"]),
    );

    assert.deepEqual(result.toCreate, []);
    assert.deepEqual(result.existingBarcodes, ["8801", "8802"]);
  });
});

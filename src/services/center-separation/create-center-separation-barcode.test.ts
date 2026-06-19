import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeCenterSeparationBarcode } from "@/lib/center-separation/normalize-barcode";
import { partitionCenterSeparationBarcodes } from "@/services/center-separation/partition-center-separation-barcodes";
import { partitionKnownBarcodesByExisting } from "@/services/center-separation/partition-known-barcodes-by-existing";

describe("createCenterSeparationBarcode", () => {
  it("rejects empty barcode via normalization", () => {
    assert.equal(normalizeCenterSeparationBarcode("   "), "");
  });

  it("prepares dashboard-unlinked barcode for registration", () => {
    const normalized = "8809990001";

    const dashboard = partitionCenterSeparationBarcodes(
      [normalized],
      new Set(),
    );
    const existing = partitionKnownBarcodesByExisting([normalized], new Set());

    assert.deepEqual(dashboard.missingBarcodes, [normalized]);
    assert.deepEqual(existing.toCreate, [normalized]);
  });
});

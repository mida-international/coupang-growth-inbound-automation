import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { partitionCenterSeparationBarcodes } from "@/services/center-separation/partition-center-separation-barcodes";
import { partitionKnownBarcodesByExisting } from "@/services/center-separation/partition-known-barcodes-by-existing";

describe("upsertCenterSeparationBarcodes registration flow", () => {
  it("prepares all deduped barcodes for create when dashboard-unlinked", () => {
    const dedupedBarcodes = ["8809990001", "8809990002"];

    const dashboard = partitionCenterSeparationBarcodes(
      dedupedBarcodes,
      new Set(),
    );
    const existing = partitionKnownBarcodesByExisting(
      dedupedBarcodes,
      new Set(),
    );

    assert.deepEqual(dashboard.knownBarcodes, []);
    assert.deepEqual(dashboard.missingBarcodes, dedupedBarcodes);
    assert.deepEqual(existing.toCreate, dedupedBarcodes);
    assert.deepEqual(existing.existingBarcodes, []);
  });

  it("still creates dashboard-linked and unlinked barcodes together", () => {
    const dedupedBarcodes = ["8801000001", "8809990001"];

    const dashboard = partitionCenterSeparationBarcodes(
      dedupedBarcodes,
      new Set(["8801000001"]),
    );
    const existing = partitionKnownBarcodesByExisting(
      dedupedBarcodes,
      new Set(),
    );

    assert.deepEqual(dashboard.knownBarcodes, ["8801000001"]);
    assert.deepEqual(dashboard.missingBarcodes, ["8809990001"]);
    assert.deepEqual(existing.toCreate, dedupedBarcodes);
  });
});

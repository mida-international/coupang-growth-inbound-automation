import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapShoplingInboundDeliverableRow } from "@/services/deliverables/list-shopling-inbound-deliverables";
import { normalizeShoplingInboundDeliverablePageSize } from "@/services/deliverables/types";

describe("mapShoplingInboundDeliverableRow", () => {
  it("aggregates barcode count and total quantity", () => {
    const result = mapShoplingInboundDeliverableRow({
      id: "deliverable-1",
      outputFileName: "shopling_gross_inbound_20260617.xlsx",
      sourceFileName: " inbound.xlsx ",
      recordedAt: new Date("2026-06-17T05:00:00.000Z"),
      recordedBy: { name: "홍길동", email: "user@example.com" },
      items: [
        { barcode: "8801111111111", quantity: 2 },
        { barcode: "8802222222222", quantity: 3 },
      ],
    });

    assert.equal(result.id, "deliverable-1");
    assert.equal(result.sourceFileName, " inbound.xlsx ");
    assert.equal(result.recordedByName, "홍길동");
    assert.equal(result.barcodeCount, 2);
    assert.equal(result.totalQuantity, 5);
    assert.deepEqual(result.items, [
      { barcode: "8801111111111", quantity: 2 },
      { barcode: "8802222222222", quantity: 3 },
    ]);
  });

  it("falls back to email when recordedBy name is missing", () => {
    const result = mapShoplingInboundDeliverableRow({
      id: "deliverable-2",
      outputFileName: "shopling_gross_inbound_20260617.xlsx",
      sourceFileName: null,
      recordedAt: new Date("2026-06-17T05:00:00.000Z"),
      recordedBy: { name: null, email: "user@example.com" },
      items: [],
    });

    assert.equal(result.recordedByName, "user@example.com");
    assert.equal(result.barcodeCount, 0);
    assert.equal(result.totalQuantity, 0);
  });
});

describe("normalizeShoplingInboundDeliverablePageSize", () => {
  it("returns default for invalid values", () => {
    assert.equal(normalizeShoplingInboundDeliverablePageSize(undefined), 20);
    assert.equal(normalizeShoplingInboundDeliverablePageSize(999), 20);
  });

  it("accepts allowed page sizes", () => {
    assert.equal(normalizeShoplingInboundDeliverablePageSize(50), 50);
  });
});

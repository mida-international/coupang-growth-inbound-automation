import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { aggregateOutboundDeductRows } from "@/lib/deliverables/aggregate-outbound-deduct-rows";

describe("aggregateOutboundDeductRows", () => {
  it("returns a single row for one barcode", () => {
    const result = aggregateOutboundDeductRows([
      { barcode: "8801111111111", deductQty: 3 },
    ]);

    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      barcode: "8801111111111",
      quantity: 3,
    });
  });

  it("sums deductQty for duplicate barcodes", () => {
    const result = aggregateOutboundDeductRows([
      { barcode: "8801111111111", deductQty: 2 },
      { barcode: "8801111111111", deductQty: 5 },
    ]);

    assert.equal(result.length, 1);
    assert.equal(result[0].quantity, 7);
  });

  it("trims barcode whitespace", () => {
    const result = aggregateOutboundDeductRows([
      { barcode: " 8801111111111 ", deductQty: 2 },
      { barcode: "8801111111111", deductQty: 1 },
    ]);

    assert.equal(result.length, 1);
    assert.equal(result[0].barcode, "8801111111111");
    assert.equal(result[0].quantity, 3);
  });

  it("excludes zero or negative quantities and empty barcodes", () => {
    const result = aggregateOutboundDeductRows([
      { barcode: "8801111111111", deductQty: 0 },
      { barcode: "8802222222222", deductQty: -1 },
      { barcode: "   ", deductQty: 4 },
    ]);

    assert.deepEqual(result, []);
  });

  it("returns an empty array for empty input", () => {
    assert.deepEqual(aggregateOutboundDeductRows([]), []);
  });
});

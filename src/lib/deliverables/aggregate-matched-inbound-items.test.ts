import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { aggregateMatchedInboundItems } from "@/lib/deliverables/aggregate-matched-inbound-items";

describe("aggregateMatchedInboundItems", () => {
  it("returns a single row for one barcode", () => {
    const result = aggregateMatchedInboundItems([
      {
        productBarcode: "8801111111111",
        coupangOptionId: "11111111",
        quantity: 3,
      },
    ]);

    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      productBarcode: "8801111111111",
      coupangOptionId: "11111111",
      quantity: 3,
    });
  });

  it("sums quantity and keeps the first non-empty option id for duplicate barcodes", () => {
    const result = aggregateMatchedInboundItems([
      {
        productBarcode: "8801111111111",
        coupangOptionId: "11111111",
        quantity: 2,
      },
      {
        productBarcode: "8801111111111",
        coupangOptionId: "22222222",
        quantity: 5,
      },
    ]);

    assert.equal(result.length, 1);
    assert.equal(result[0].quantity, 7);
    assert.equal(result[0].coupangOptionId, "11111111");
  });

  it("uses later non-empty option id when the first row has none", () => {
    const result = aggregateMatchedInboundItems([
      {
        productBarcode: "8801111111111",
        coupangOptionId: "",
        quantity: 2,
      },
      {
        productBarcode: "8801111111111",
        coupangOptionId: "22222222",
        quantity: 1,
      },
    ]);

    assert.equal(result[0].coupangOptionId, "22222222");
    assert.equal(result[0].quantity, 3);
  });

  it("excludes zero or negative quantities", () => {
    const result = aggregateMatchedInboundItems([
      {
        productBarcode: "8801111111111",
        coupangOptionId: "11111111",
        quantity: 0,
      },
      {
        productBarcode: "8802222222222",
        coupangOptionId: "22222222",
        quantity: -1,
      },
    ]);

    assert.deepEqual(result, []);
  });

  it("returns an empty array for empty input", () => {
    assert.deepEqual(aggregateMatchedInboundItems([]), []);
  });
});

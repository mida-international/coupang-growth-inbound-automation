import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  decodeUnmatchedBarcodesHeader,
  encodeUnmatchedBarcodesHeader,
  UNMATCHED_BARCODES_HEADER_LIMIT,
} from "@/lib/deliverables/unmatched-barcodes-header";

describe("unmatched-barcodes-header", () => {
  it("round-trips barcodes and quantities", () => {
    const items = [
      { barcode: "8801111111111", quantity: 3 },
      { barcode: "8802222222222", quantity: 12 },
    ];

    const encoded = encodeUnmatchedBarcodesHeader(items);

    assert.equal(encoded, "8801111111111:3,8802222222222:12");
    assert.deepEqual(decodeUnmatchedBarcodesHeader(encoded), items);
  });

  it("escapes non-numeric barcodes so the header stays ASCII", () => {
    const items = [{ barcode: "A-1:가,2", quantity: 1 }];
    const encoded = encodeUnmatchedBarcodesHeader(items);

    assert.match(encoded, /^[\x20-\x7e]*$/);
    assert.deepEqual(decodeUnmatchedBarcodesHeader(encoded), items);
  });

  it("caps the number of encoded items", () => {
    const items = Array.from(
      { length: UNMATCHED_BARCODES_HEADER_LIMIT + 10 },
      (_, index) => ({ barcode: String(8800000000000 + index), quantity: 1 }),
    );

    assert.equal(
      decodeUnmatchedBarcodesHeader(encodeUnmatchedBarcodesHeader(items))
        .length,
      UNMATCHED_BARCODES_HEADER_LIMIT,
    );
  });

  it("returns an empty list for missing or empty headers", () => {
    assert.deepEqual(decodeUnmatchedBarcodesHeader(null), []);
    assert.deepEqual(decodeUnmatchedBarcodesHeader(""), []);
  });
});

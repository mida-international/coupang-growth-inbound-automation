import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeInboundRotationsByBarcode,
  computeInboundRotationsForBarcode,
  toKstDateKey,
} from "@/lib/inbound/compute-inbound-rotations";

const BARCODE_A = "8801111111111";
const BARCODE_B = "8802222222222";

describe("toKstDateKey", () => {
  it("maps UTC afternoon to the next KST calendar day", () => {
    const key = toKstDateKey(new Date("2026-06-15T15:00:00.000Z"));

    assert.equal(key, "2026-06-16");
  });
});

describe("computeInboundRotationsForBarcode", () => {
  it("returns rotation1 only for a single event", () => {
    const result = computeInboundRotationsForBarcode([
      {
        productBarcode: BARCODE_A,
        quantity: 10,
        recordedAt: new Date("2026-06-15T01:00:00.000Z"),
      },
    ]);

    assert.equal(result.rotation1Qty, 10);
    assert.equal(result.rotation1Date, "2026-06-15");
    assert.equal(result.rotation2Qty, null);
    assert.equal(result.rotation3Qty, null);
  });

  it("sums multiple events on the same KST day into rotation1", () => {
    const result = computeInboundRotationsForBarcode([
      {
        productBarcode: BARCODE_A,
        quantity: 10,
        recordedAt: new Date("2026-06-15T01:00:00.000Z"),
      },
      {
        productBarcode: BARCODE_A,
        quantity: 5,
        recordedAt: new Date("2026-06-15T12:00:00.000Z"),
      },
    ]);

    assert.equal(result.rotation1Qty, 15);
    assert.equal(result.rotation1Date, "2026-06-15");
    assert.equal(result.rotation2Qty, null);
  });

  it("maps the three most recent KST days to rotation1 through rotation3", () => {
    const result = computeInboundRotationsForBarcode([
      {
        productBarcode: BARCODE_A,
        quantity: 3,
        recordedAt: new Date("2026-06-01T01:00:00.000Z"),
      },
      {
        productBarcode: BARCODE_A,
        quantity: 8,
        recordedAt: new Date("2026-06-10T01:00:00.000Z"),
      },
      {
        productBarcode: BARCODE_A,
        quantity: 10,
        recordedAt: new Date("2026-06-15T01:00:00.000Z"),
      },
      {
        productBarcode: BARCODE_A,
        quantity: 5,
        recordedAt: new Date("2026-06-15T12:00:00.000Z"),
      },
    ]);

    assert.equal(result.rotation1Qty, 15);
    assert.equal(result.rotation1Date, "2026-06-15");
    assert.equal(result.rotation2Qty, 8);
    assert.equal(result.rotation2Date, "2026-06-10");
    assert.equal(result.rotation3Qty, 3);
    assert.equal(result.rotation3Date, "2026-06-01");
  });

  it("leaves rotation3 null when only two inbound days exist", () => {
    const result = computeInboundRotationsForBarcode([
      {
        productBarcode: BARCODE_A,
        quantity: 4,
        recordedAt: new Date("2026-06-12T01:00:00.000Z"),
      },
      {
        productBarcode: BARCODE_A,
        quantity: 2,
        recordedAt: new Date("2026-06-08T01:00:00.000Z"),
      },
    ]);

    assert.equal(result.rotation1Qty, 4);
    assert.equal(result.rotation2Qty, 2);
    assert.equal(result.rotation3Qty, null);
    assert.equal(result.rotation3Date, null);
  });

  it("ignores zero or negative quantities", () => {
    const result = computeInboundRotationsForBarcode([
      {
        productBarcode: BARCODE_A,
        quantity: 0,
        recordedAt: new Date("2026-06-15T01:00:00.000Z"),
      },
      {
        productBarcode: BARCODE_A,
        quantity: -1,
        recordedAt: new Date("2026-06-14T01:00:00.000Z"),
      },
    ]);

    assert.deepEqual(result, {
      rotation1Qty: null,
      rotation2Qty: null,
      rotation3Qty: null,
      rotation1Date: null,
      rotation2Date: null,
      rotation3Date: null,
    });
  });
});

describe("computeInboundRotationsByBarcode", () => {
  it("computes rotations independently per barcode", () => {
    const result = computeInboundRotationsByBarcode([
      {
        productBarcode: BARCODE_A,
        quantity: 10,
        recordedAt: new Date("2026-06-15T01:00:00.000Z"),
      },
      {
        productBarcode: BARCODE_A,
        quantity: 7,
        recordedAt: new Date("2026-06-10T01:00:00.000Z"),
      },
      {
        productBarcode: BARCODE_B,
        quantity: 4,
        recordedAt: new Date("2026-06-12T01:00:00.000Z"),
      },
    ]);

    assert.equal(result.get(BARCODE_A)?.rotation1Qty, 10);
    assert.equal(result.get(BARCODE_A)?.rotation2Qty, 7);
    assert.equal(result.get(BARCODE_A)?.rotation3Qty, null);
    assert.equal(result.get(BARCODE_B)?.rotation1Qty, 4);
    assert.equal(result.get(BARCODE_B)?.rotation2Qty, null);
  });
});

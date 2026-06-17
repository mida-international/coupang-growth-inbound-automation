import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildTrendsQuantityMaps,
  mergeTrendsDateValues,
} from "@/services/inbound-trends/merge-trends-quantities";

describe("buildTrendsQuantityMaps", () => {
  it("aggregates quantities by trimmed barcode and date", () => {
    const maps = buildTrendsQuantityMaps(
      [
        {
          product_barcode: " 123 ",
          record_date: new Date("2026-06-17T00:00:00.000Z"),
          quantity: 5,
        },
        {
          product_barcode: "123",
          record_date: new Date("2026-06-17T00:00:00.000Z"),
          quantity: 3,
        },
      ],
      [
        {
          product_barcode: "123",
          record_date: new Date("2026-06-17T00:00:00.000Z"),
          quantity: 2,
        },
      ],
    );

    assert.equal(maps.coupang.get("123")?.get("2026-06-17"), 8);
    assert.equal(maps.warehouse.get("123")?.get("2026-06-17"), 2);
  });
});

describe("mergeTrendsDateValues", () => {
  it("returns null quantities when no record exists", () => {
    const maps = buildTrendsQuantityMaps([], []);
    const values = mergeTrendsDateValues("123", ["2026-06-17"], maps);

    assert.deepEqual(values, {
      "2026-06-17": { coupang: null, warehouse: null },
    });
  });

  it("fills coupang and warehouse values independently", () => {
    const maps = buildTrendsQuantityMaps(
      [
        {
          product_barcode: "123",
          record_date: new Date("2026-06-17T00:00:00.000Z"),
          quantity: 4,
        },
      ],
      [
        {
          product_barcode: "123",
          record_date: new Date("2026-06-18T00:00:00.000Z"),
          quantity: 7,
        },
      ],
    );

    const values = mergeTrendsDateValues(
      "123",
      ["2026-06-17", "2026-06-18"],
      maps,
    );

    assert.deepEqual(values, {
      "2026-06-17": { coupang: 4, warehouse: null },
      "2026-06-18": { coupang: null, warehouse: 7 },
    });
  });
});

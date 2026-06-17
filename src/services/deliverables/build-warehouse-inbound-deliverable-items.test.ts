import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildWarehouseInboundDeliverableItems } from "@/services/deliverables/build-warehouse-inbound-deliverable-items";
import type { WarehouseInboundListRow } from "@/services/deliverables/types";

const sampleRows: WarehouseInboundListRow[] = [
  {
    location: "A-01",
    registeredProductName: "상품A",
    optionName: "옵션A",
    productBarcode: "8801111111111",
    growthInboundRecommend: 10,
  },
  {
    location: "B-02",
    registeredProductName: "상품B",
    optionName: null,
    productBarcode: "8802222222222",
    growthInboundRecommend: 5,
  },
];

describe("buildWarehouseInboundDeliverableItems", () => {
  it("maps rows to B~G deliverable items with recordDate", () => {
    const recordDate = new Date("2026-06-17T00:00:00.000Z");

    assert.deepEqual(
      buildWarehouseInboundDeliverableItems(
        "deliverable-1",
        sampleRows,
        recordDate,
      ),
      [
        {
          deliverableId: "deliverable-1",
          recordDate,
          location: "A-01",
          registeredProductName: "상품A",
          optionName: "옵션A",
          productBarcode: "8801111111111",
          quantity: 10,
        },
        {
          deliverableId: "deliverable-1",
          recordDate,
          location: "B-02",
          registeredProductName: "상품B",
          optionName: null,
          productBarcode: "8802222222222",
          quantity: 5,
        },
      ],
    );
  });

  it("returns an empty array when rows are empty", () => {
    const recordDate = new Date("2026-06-17T00:00:00.000Z");

    assert.deepEqual(
      buildWarehouseInboundDeliverableItems("deliverable-1", [], recordDate),
      [],
    );
  });
});

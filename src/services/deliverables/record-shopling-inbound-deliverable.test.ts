import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { aggregateOutboundDeductRows } from "@/lib/deliverables/aggregate-outbound-deduct-rows";
import {
  buildShoplingInboundDeliverableItemCreates,
} from "@/services/deliverables/record-shopling-inbound-deliverable";

describe("recordShoplingInboundDeliverable helpers", () => {
  it("builds createMany rows from aggregated barcodes", () => {
    const aggregated = aggregateOutboundDeductRows([
      { barcode: "8801111111111", deductQty: 2 },
      { barcode: "8801111111111", deductQty: 3 },
      { barcode: "8802222222222", deductQty: 1 },
    ]);

    assert.deepEqual(
      buildShoplingInboundDeliverableItemCreates("deliverable-1", aggregated),
      [
        {
          deliverableId: "deliverable-1",
          barcode: "8801111111111",
          quantity: 5,
        },
        {
          deliverableId: "deliverable-1",
          barcode: "8802222222222",
          quantity: 1,
        },
      ],
    );
  });

  it("returns an empty array when aggregation is empty", () => {
    assert.deepEqual(
      buildShoplingInboundDeliverableItemCreates("deliverable-1", []),
      [],
    );
  });
});

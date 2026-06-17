import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapWarehouseInboundDeliverableRow } from "@/services/deliverables/list-warehouse-inbound-deliverables";

describe("mapWarehouseInboundDeliverableRow", () => {
  it("maps deliverable summary and B~G item fields", () => {
    const mapped = mapWarehouseInboundDeliverableRow({
      id: "deliverable-1",
      outputFileName: "창고전송용_입고리스트_테스트_2026-06-17.xlsx",
      recordDate: new Date("2026-06-17T00:00:00.000Z"),
      rotationCount: 2,
      recordedAt: new Date("2026-06-17T12:34:56.000Z"),
      coupangSellerAccount: { displayName: "테스트 판매자" },
      recordedBy: { name: "홍길동", email: "user@example.com" },
      items: [
        {
          recordDate: new Date("2026-06-17T00:00:00.000Z"),
          location: "A-01",
          registeredProductName: "상품A",
          optionName: "옵션A",
          productBarcode: "8801111111111",
          quantity: 10,
        },
        {
          recordDate: new Date("2026-06-17T00:00:00.000Z"),
          location: null,
          registeredProductName: "상품B",
          optionName: null,
          productBarcode: "8802222222222",
          quantity: 5,
        },
      ],
    });

    assert.equal(mapped.itemCount, 2);
    assert.equal(mapped.totalQuantity, 15);
    assert.equal(mapped.sellerDisplayName, "테스트 판매자");
    assert.equal(mapped.recordDate, "2026-06-17");
    assert.equal(mapped.rotationCount, 2);
    assert.equal(mapped.recordedByName, "홍길동");
    assert.deepEqual(mapped.items[0], {
      recordDate: "2026-06-17",
      location: "A-01",
      registeredProductName: "상품A",
      optionName: "옵션A",
      productBarcode: "8801111111111",
      quantity: 10,
    });
  });

  it("falls back to email when recordedBy name is missing", () => {
    const mapped = mapWarehouseInboundDeliverableRow({
      id: "deliverable-2",
      outputFileName: "창고전송용_입고리스트_테스트_2026-06-17.xlsx",
      recordDate: new Date("2026-06-17T00:00:00.000Z"),
      rotationCount: 0,
      recordedAt: new Date("2026-06-17T12:34:56.000Z"),
      coupangSellerAccount: { displayName: "테스트 판매자" },
      recordedBy: { name: null, email: "user@example.com" },
      items: [],
    });

    assert.equal(mapped.recordedByName, "user@example.com");
    assert.equal(mapped.itemCount, 0);
    assert.equal(mapped.totalQuantity, 0);
  });
});

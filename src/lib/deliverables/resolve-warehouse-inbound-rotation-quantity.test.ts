import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { OutboundPackageComponent } from "@/lib/deliverables/decompose-outbound-deduct-rows";
import { resolveWarehouseInboundRotationQuantity } from "@/lib/deliverables/resolve-warehouse-inbound-rotation-quantity";

describe("resolveWarehouseInboundRotationQuantity", () => {
  const packageMappings = new Map<string, OutboundPackageComponent[]>([
    [
      "880PKG0001",
      [
        { singleBarcode: "8801111111111", mapCnt: 2 },
        { singleBarcode: "8802222222222", mapCnt: 1 },
      ],
    ],
  ]);

  it("returns direct quantity for a regular barcode", () => {
    const qtyByBarcode = new Map([["8803333333333", 5]]);

    assert.equal(
      resolveWarehouseInboundRotationQuantity(
        "8803333333333",
        qtyByBarcode,
        packageMappings,
      ),
      5,
    );
  });

  it("returns null when a regular barcode is not in the batch", () => {
    assert.equal(
      resolveWarehouseInboundRotationQuantity(
        "8803333333333",
        new Map(),
        packageMappings,
      ),
      null,
    );
  });

  it("sums only saved single barcodes for a package barcode", () => {
    const qtyByBarcode = new Map([["8801111111111", 4]]);

    assert.equal(
      resolveWarehouseInboundRotationQuantity(
        "880PKG0001",
        qtyByBarcode,
        packageMappings,
      ),
      4,
    );
  });

  it("returns null for a package barcode when no component quantities exist", () => {
    assert.equal(
      resolveWarehouseInboundRotationQuantity(
        "880PKG0001",
        new Map(),
        packageMappings,
      ),
      null,
    );
  });

  it("returns null for empty barcode", () => {
    assert.equal(
      resolveWarehouseInboundRotationQuantity("   ", new Map(), packageMappings),
      null,
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import {
  buildWarehouseInboundListFilename,
  generateWarehouseInboundListBuffer,
  getWarehouseInboundListColumnKeys,
} from "@/lib/excel/generators/warehouse-inbound-list";
import type { WarehouseInboundListRow } from "@/services/deliverables/types";

const sampleRows: WarehouseInboundListRow[] = [
  {
    location: "A-01",
    registeredProductName: "상품A",
    optionName: "옵션A",
    productBarcode: "8801111111111",
    growthInboundRecommend: 10,
  },
];

function readHeaderRow(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]]!;
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
  });

  return (rows[0] ?? []).map((value) => String(value));
}

describe("generateWarehouseInboundListBuffer", () => {
  it("keeps the default 7 columns when rotationCount is 0", () => {
    const buffer = generateWarehouseInboundListBuffer(sampleRows);

    assert.deepEqual(readHeaderRow(buffer), getWarehouseInboundListColumnKeys(0));
  });

  it("appends rotation headers when rotationCount is 2", () => {
    const buffer = generateWarehouseInboundListBuffer(sampleRows, {
      rotationCount: 2,
      rotationBatches: [
        {
          recordedAt: new Date("2026-06-17T00:00:00.000Z"),
          qtyByBarcode: new Map([["8801111111111", 3]]),
        },
        {
          recordedAt: new Date("2026-06-16T00:00:00.000Z"),
          qtyByBarcode: new Map([["8801111111111", 1]]),
        },
      ],
    });

    assert.deepEqual(readHeaderRow(buffer), getWarehouseInboundListColumnKeys(2));
  });
});

describe("buildWarehouseInboundListFilename", () => {
  it("places seller slug before the KST date suffix", () => {
    const filename = buildWarehouseInboundListFilename(
      "테스트 판매자",
      new Date("2026-06-17T00:00:00.000Z"),
    );

    assert.equal(filename, "창고전송용_입고리스트_테스트_판매자_2026-06-17.xlsx");
  });
});

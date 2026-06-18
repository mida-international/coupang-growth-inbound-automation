import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";

import {
  buildWarehouseInboundListFilename,
  buildWarehouseInboundListGrid,
  CENTER_SEPARATION_COLUMN_KEY,
  CENTER_SEPARATION_MARKER,
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

function readFirstDataRow(buffer: Buffer): Record<string, string | number> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]]!;

  return XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
    defval: "",
  })[0]!;
}

describe("getWarehouseInboundListColumnKeys", () => {
  it("appends center separation after rotation columns", () => {
    assert.deepEqual(getWarehouseInboundListColumnKeys(3), [
      "box",
      "date",
      "location",
      "등록상품명",
      "옵션명",
      "바코드",
      "수량",
      "1회차",
      "2회차",
      "3회차",
      CENTER_SEPARATION_COLUMN_KEY,
    ]);
  });
});

function readAllRows(buffer: Buffer): string[][] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]]!;

  return XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
  }).map((row) => row.map((value) => String(value)));
}

describe("buildWarehouseInboundListGrid", () => {
  it("matches generateWarehouseInboundListBuffer xlsx content", () => {
    const options = {
      rotationCount: 2 as const,
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
      centerSeparationBarcodes: new Set(["8801111111111"]),
    };
    const fixedDate = new Date("2026-06-17T00:00:00.000Z");
    const grid = buildWarehouseInboundListGrid(sampleRows, options, fixedDate);
    const buffer = generateWarehouseInboundListBuffer(sampleRows, options, fixedDate);
    const sheetRows = readAllRows(buffer);

    assert.equal(grid.sheetTitle, "6.17요청");
    assert.deepEqual(grid.headers, sheetRows[0]);
    assert.deepEqual([grid.headers, ...grid.rows], sheetRows);
  });
});

describe("generateWarehouseInboundListBuffer", () => {
  it("includes center separation as the last column when rotationCount is 0", () => {
    const buffer = generateWarehouseInboundListBuffer(sampleRows);

    assert.deepEqual(readHeaderRow(buffer), getWarehouseInboundListColumnKeys(0));
    assert.equal(
      readFirstDataRow(buffer)[CENTER_SEPARATION_COLUMN_KEY],
      "",
    );
  });

  it("appends rotation headers before center separation when rotationCount is 2", () => {
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

  it("marks center separation cells when the product barcode is registered", () => {
    const buffer = generateWarehouseInboundListBuffer(sampleRows, {
      centerSeparationBarcodes: new Set(["8801111111111"]),
    });

    assert.equal(
      readFirstDataRow(buffer)[CENTER_SEPARATION_COLUMN_KEY],
      CENTER_SEPARATION_MARKER,
    );
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

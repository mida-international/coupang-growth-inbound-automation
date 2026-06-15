import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShoplingSyncChunk,
  buildShoplingSyncChunks,
  SHOPLING_SYNC_MAX_CHUNKS,
} from "@/lib/shopling/chunk-date-ranges";
import { parseYyyyMmDd } from "@/lib/shopling/format-yyyymmdd";

const TODAY_2026_06_12 = parseYyyyMmDd("20260612");

describe("buildShoplingSyncChunk", () => {
  it("chunk 0 ends on today and spans 3 months", () => {
    const chunk = buildShoplingSyncChunk(TODAY_2026_06_12, 0);

    assert.equal(chunk.endDt, "20260612");
    assert.equal(chunk.startDt, "20260312");
  });

  it("chunk 1 touches chunk 0 start (same boundary day)", () => {
    const chunk0 = buildShoplingSyncChunk(TODAY_2026_06_12, 0);
    const chunk1 = buildShoplingSyncChunk(TODAY_2026_06_12, 1);

    assert.equal(chunk1.endDt, chunk0.startDt);
    assert.equal(chunk1.startDt, "20251212");
  });

  it("matches example table for chunks 0-3", () => {
    const expected = [
      { startDt: "20260312", endDt: "20260612" },
      { startDt: "20251212", endDt: "20260312" },
      { startDt: "20250912", endDt: "20251212" },
      { startDt: "20250612", endDt: "20250912" },
    ];

    for (const [index, exp] of expected.entries()) {
      const chunk = buildShoplingSyncChunk(TODAY_2026_06_12, index);

      assert.equal(chunk.startDt, exp.startDt, `chunk ${index} start`);
      assert.equal(chunk.endDt, exp.endDt, `chunk ${index} end`);
    }
  });

  it("adjacent chunks share boundary: chunk[n].endDt === chunk[n-1].startDt", () => {
    const chunks = buildShoplingSyncChunks(TODAY_2026_06_12).slice(0, 10);

    for (let i = 1; i < chunks.length; i++) {
      assert.equal(
        chunks[i]!.endDt,
        chunks[i - 1]!.startDt,
        `boundary at chunk ${i}`,
      );
    }
  });

  it("month-end clamp keeps touching boundaries (Jan 31)", () => {
    const today = parseYyyyMmDd("20260131");
    const chunk0 = buildShoplingSyncChunk(today, 0);
    const chunk1 = buildShoplingSyncChunk(today, 1);

    assert.equal(chunk0.endDt, "20260131");
    assert.equal(chunk1.endDt, chunk0.startDt);
  });
});

describe("buildShoplingSyncChunks", () => {
  it("returns at most SHOPLING_SYNC_MAX_CHUNKS entries", () => {
    assert.equal(
      buildShoplingSyncChunks(TODAY_2026_06_12).length,
      SHOPLING_SYNC_MAX_CHUNKS,
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

type MappingRow = {
  packageOptId: string;
  singleOptId: string;
  mapCnt: number;
};

function mappingPairKey(packageOptId: string, singleOptId: string): string {
  return `${packageOptId}__${singleOptId}`;
}

function prepareReloadRows(
  packageMappings: MappingRow[],
  manualKeys: Set<string>,
): { rows: MappingRow[]; skippedManual: number; duplicatesRemoved: number } {
  const upsertRows: MappingRow[] = [];
  let skippedManual = 0;

  for (const mapping of packageMappings) {
    if (manualKeys.has(mappingPairKey(mapping.packageOptId, mapping.singleOptId))) {
      skippedManual++;
      continue;
    }

    upsertRows.push(mapping);
  }

  const dedupMap = new Map<string, MappingRow>();

  for (const row of upsertRows) {
    dedupMap.set(mappingPairKey(row.packageOptId, row.singleOptId), row);
  }

  const rows = [...dedupMap.values()];

  return {
    rows,
    skippedManual,
    duplicatesRemoved: upsertRows.length - rows.length,
  };
}

describe("package mapping reload row preparation", () => {
  it("dedupes rows by packageOptId+singleOptId keeping last value", () => {
    const result = prepareReloadRows(
      [
        { packageOptId: "pkg-1", singleOptId: "single-1", mapCnt: 2 },
        { packageOptId: "pkg-1", singleOptId: "single-1", mapCnt: 5 },
        { packageOptId: "pkg-2", singleOptId: "single-2", mapCnt: 1 },
      ],
      new Set(),
    );

    assert.equal(result.duplicatesRemoved, 1);
    assert.deepEqual(result.rows, [
      { packageOptId: "pkg-1", singleOptId: "single-1", mapCnt: 5 },
      { packageOptId: "pkg-2", singleOptId: "single-2", mapCnt: 1 },
    ]);
  });

  it("excludes manual keys from reload rows", () => {
    const result = prepareReloadRows(
      [
        { packageOptId: "pkg-1", singleOptId: "single-1", mapCnt: 2 },
        { packageOptId: "pkg-2", singleOptId: "single-2", mapCnt: 3 },
      ],
      new Set([mappingPairKey("pkg-1", "single-1")]),
    );

    assert.equal(result.skippedManual, 1);
    assert.equal(result.duplicatesRemoved, 0);
    assert.deepEqual(result.rows, [
      { packageOptId: "pkg-2", singleOptId: "single-2", mapCnt: 3 },
    ]);
  });
});

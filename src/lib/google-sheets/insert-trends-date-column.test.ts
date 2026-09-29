import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDateColumnValues,
  columnIndexToLetter,
  findTitleColumnOffset,
  TITLE_SEARCH_COLUMN_COUNT,
  titleSearchColumnCount,
} from "@/lib/google-sheets/insert-trends-date-column";

describe("columnIndexToLetter", () => {
  it("converts zero-based indexes to sheet letters", () => {
    assert.equal(columnIndexToLetter(0), "A");
    assert.equal(columnIndexToLetter(15), "P");
    assert.equal(columnIndexToLetter(25), "Z");
    assert.equal(columnIndexToLetter(26), "AA");
    assert.equal(columnIndexToLetter(701), "ZZ");
  });
});

describe("findTitleColumnOffset", () => {
  it("finds today's (완) column near P", () => {
    assert.equal(findTitleColumnOffset(["9/29", "9/29(완)", "9/28"], "9/29(완)"), 1);
  });

  it("does not confuse the plain date column with the (완) column", () => {
    assert.equal(findTitleColumnOffset(["9/29(완)"], "9/29"), -1);
    assert.equal(findTitleColumnOffset(["9/29"], "9/29(완)"), -1);
  });

  it("matches plain date columns stored as date cells", () => {
    assert.equal(findTitleColumnOffset(["9월 29일"], "9/29"), 0);
  });

  it("ignores same-date columns beyond the search window (last year's column)", () => {
    const headers = Array.from({ length: TITLE_SEARCH_COLUMN_COUNT }, (_, i) =>
      `9/${28 - i}`,
    );
    headers.push("9/29(완)");

    assert.equal(findTitleColumnOffset(headers, "9/29(완)"), -1);
  });
});

describe("titleSearchColumnCount", () => {
  it("widens the search for older dates so a pushed-right column is still found", () => {
    assert.equal(titleSearchColumnCount(0), TITLE_SEARCH_COLUMN_COUNT);
    assert.equal(titleSearchColumnCount(5), TITLE_SEARCH_COLUMN_COUNT + 15);

    // 5일 전 열: 하루 2열씩 밀려 P열에서 10번째 이후에 있다
    const headers = Array.from({ length: 12 }, () => "x");
    headers.push("9/24(완)");
    assert.equal(findTitleColumnOffset(headers, "9/24(완)"), -1);
    assert.equal(
      findTitleColumnOffset(headers, "9/24(완)", titleSearchColumnCount(5)),
      12,
    );
  });

  it("stays far below last year's columns within the 60-day limit", () => {
    // 1년이면 하루 2열 × 365 ≈ 730열 오른쪽
    assert.ok(titleSearchColumnCount(60) < 365 * 2);
  });
});

describe("buildDateColumnValues", () => {
  it("fills values by barcode and blanks rows without a match", () => {
    const result = buildDateColumnValues(
      ["", "바코드", "8801111111111", "메모", "8802222222222"],
      1,
      "9/29(완)",
      new Map([["8801111111111", 15]]),
    );

    assert.deepEqual(result.values, [[""], ["9/29(완)"], ["15"], [""], [""]]);
    assert.equal(result.barcodeRowCount, 2);
    assert.equal(result.matchedCount, 1);
  });

  it("keeps the title and blanks every value when there is no data", () => {
    const result = buildDateColumnValues(
      ["바코드", "8801111111111"],
      0,
      "9/29(완)",
      new Map(),
    );

    assert.deepEqual(result.values, [["9/29(완)"], [""]]);
  });
});

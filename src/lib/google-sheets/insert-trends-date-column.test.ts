import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDateColumnValues,
  columnIndexToLetter,
  detectBarcodeColumnIndex,
  detectHeaderRowIndex,
  detectInsertColumnIndex,
  looksLikeDateHeader,
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

/** 실제 추세 시트(원본_mizucos) 구조: 바코드 Q열, R열 "2", 날짜 열 S열부터 */
function realLayoutRow(values: Record<string, string>): string[] {
  const row = new Array<string>(26).fill("");
  for (const [letter, value] of Object.entries(values)) {
    row[letter.charCodeAt(0) - 65] = value;
  }
  return row;
}

describe("sheet layout detection (real 원본_mizucos layout)", () => {
  const header = realLayoutRow({ A: "9/22", D: "확인", R: "2", S: "9/21", T: "9/17", U: "9/16", Y: "911kim" });
  const rows = [
    header,
    realLayoutRow({ K: "키즈안전칼_RM", O: "6개 파랑", Q: "2016342313041" }),
    realLayoutRow({ M: "네모브라", O: "75B 블루그린", Q: "2016341302138", S: "3" }),
    realLayoutRow({ M: "네모브라", O: "바코드 확인 필요", Q: "2016341302114" }),
  ];

  it("finds the barcode column by counting barcode-like values", () => {
    assert.equal(detectBarcodeColumnIndex(rows), 16); // Q
  });

  it("uses the row with date titles as the header row, not a stray '바코드' text", () => {
    assert.equal(detectHeaderRowIndex(rows, 16), 0);
  });

  it("inserts new date columns before the most recent date column", () => {
    assert.equal(detectInsertColumnIndex(header, 16), 18); // S
  });

  it("falls back to right after the barcode column when there are no date columns yet", () => {
    assert.equal(detectInsertColumnIndex(realLayoutRow({ O: "바코드" }), 14), 15);
  });

  it("returns null when no barcode column exists", () => {
    assert.equal(detectBarcodeColumnIndex([realLayoutRow({ A: "메모" })]), null);
  });

  it("recognizes date title formats", () => {
    for (const title of ["9/21", "9월 21일", "9/21(완)", "완6/29", "09.21"]) {
      assert.equal(looksLikeDateHeader(title), true, title);
    }
    for (const title of ["2", "911kim", "확인", ""]) {
      assert.equal(looksLikeDateHeader(title), false, title);
    }
  });
});

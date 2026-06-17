import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  enumerateDates,
  resolveTrendsDateRange,
  sortTrendsDatesDescending,
  TRENDS_DEFAULT_DAYS,
  TRENDS_MAX_SPAN_DAYS,
} from "@/services/inbound-trends/resolve-trends-date-range";

const TODAY = new Date("2026-06-17T00:00:00.000Z");

describe("resolveTrendsDateRange", () => {
  it("defaults to the last 14 days inclusive", () => {
    const result = resolveTrendsDateRange({}, TODAY);

    assert.equal(result.from, "2026-06-04");
    assert.equal(result.to, "2026-06-17");
    assert.equal(result.days, TRENDS_DEFAULT_DAYS);
    assert.equal(result.dates.length, 14);
    assert.equal(result.dates[0], "2026-06-17");
    assert.equal(result.dates.at(-1), "2026-06-04");
  });

  it("supports day presets", () => {
    const result = resolveTrendsDateRange({ days: 30 }, TODAY);

    assert.equal(result.from, "2026-05-19");
    assert.equal(result.to, "2026-06-17");
    assert.equal(result.days, 30);
    assert.equal(result.dates.length, 30);
  });

  it("prefers valid custom from/to over presets", () => {
    const result = resolveTrendsDateRange(
      {
        from: "2026-06-01",
        to: "2026-06-10",
        days: 60,
      },
      TODAY,
    );

    assert.equal(result.from, "2026-06-01");
    assert.equal(result.to, "2026-06-10");
    assert.equal(result.days, null);
    assert.equal(result.dates.length, 10);
  });

  it("clamps custom ranges longer than 31 days", () => {
    const result = resolveTrendsDateRange(
      {
        from: "2026-05-01",
        to: "2026-06-17",
      },
      TODAY,
    );

    assert.equal(result.to, "2026-06-17");
    assert.equal(result.dates.length, TRENDS_MAX_SPAN_DAYS);
    assert.equal(result.from, "2026-05-18");
  });

  it("falls back to default when custom range is invalid", () => {
    const result = resolveTrendsDateRange(
      {
        from: "2026-06-10",
        to: "2026-06-01",
      },
      TODAY,
    );

    assert.equal(result.days, TRENDS_DEFAULT_DAYS);
    assert.equal(result.to, "2026-06-17");
  });
});

describe("sortTrendsDatesDescending", () => {
  it("sorts dates from newest to oldest", () => {
    assert.deepEqual(
      sortTrendsDatesDescending(["2026-06-15", "2026-06-17", "2026-06-16"]),
      ["2026-06-17", "2026-06-16", "2026-06-15"],
    );
  });
});

describe("enumerateDates", () => {
  it("returns inclusive date keys", () => {
    assert.deepEqual(enumerateDates("2026-06-15", "2026-06-17"), [
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
    ]);
  });
});

import { getKstTodayDate } from "@/lib/date/kst-today";
import { subtractDaysFromKstDate } from "@/lib/shopling/format-yyyymmdd";

export const TRENDS_DAY_PRESETS = [7, 14, 30, 60] as const;
export const TRENDS_DEFAULT_DAYS = 14;
export const TRENDS_MAX_SPAN_DAYS = 31;

export type TrendsDayPreset = (typeof TRENDS_DAY_PRESETS)[number];

export type ResolvedTrendsDateRange = {
  from: string;
  to: string;
  days: TrendsDayPreset | null;
  dates: string[];
};

export type ResolveTrendsDateRangeInput = {
  from?: string;
  to?: string;
  days?: string | number;
};

function toIsoDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function parseDayPreset(
  value: string | number | undefined,
): TrendsDayPreset | null {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return TRENDS_DAY_PRESETS.includes(parsed as TrendsDayPreset)
    ? (parsed as TrendsDayPreset)
    : null;
}

function clampRange(from: Date, to: Date): { from: Date; to: Date } {
  const spanDays =
    Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  if (spanDays <= TRENDS_MAX_SPAN_DAYS) {
    return { from, to };
  }

  const clampedFrom = subtractDaysFromKstDate(to, TRENDS_MAX_SPAN_DAYS - 1);
  return { from: clampedFrom, to };
}

export function enumerateDates(from: string, to: string): string[] {
  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);

  if (!fromDate || !toDate || fromDate.getTime() > toDate.getTime()) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(fromDate);

  while (cursor.getTime() <= toDate.getTime()) {
    dates.push(toIsoDateString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function sortTrendsDatesDescending(dates: string[]): string[] {
  return [...dates].sort((a, b) => b.localeCompare(a));
}

function resolveDisplayDates(from: string, to: string): string[] {
  return sortTrendsDatesDescending(enumerateDates(from, to));
}

function resolvePresetRange(
  days: TrendsDayPreset,
  today: Date,
): ResolvedTrendsDateRange {
  const to = toIsoDateString(today);
  const from = toIsoDateString(subtractDaysFromKstDate(today, days - 1));

  return {
    from,
    to,
    days,
    dates: resolveDisplayDates(from, to),
  };
}

export function resolveTrendsDateRange(
  input: ResolveTrendsDateRangeInput = {},
  today: Date = getKstTodayDate(),
): ResolvedTrendsDateRange {
  const fromDate = input.from ? parseIsoDate(input.from) : null;
  const toDate = input.to ? parseIsoDate(input.to) : null;

  if (fromDate && toDate && fromDate.getTime() <= toDate.getTime()) {
    const clamped = clampRange(fromDate, toDate);
    const from = toIsoDateString(clamped.from);
    const to = toIsoDateString(clamped.to);

    return {
      from,
      to,
      days: null,
      dates: resolveDisplayDates(from, to),
    };
  }

  const preset = parseDayPreset(input.days) ?? TRENDS_DEFAULT_DAYS;

  return resolvePresetRange(preset, today);
}

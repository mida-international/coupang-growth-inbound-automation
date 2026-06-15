import { getKstTodayDate } from "@/lib/date/kst-today";

export function formatYyyyMmDd(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

export function getKstTodayYyyyMmDd(): string {
  return formatYyyyMmDd(getKstTodayDate());
}

export function subtractDaysFromKstDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);

  return result;
}

export function parseYyyyMmDd(ymd: string): Date {
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(4, 6)) - 1;
  const day = Number(ymd.slice(6, 8));

  return new Date(Date.UTC(year, month, day));
}

/** KST calendar date stored as UTC parts — month-end clamped (e.g. Jan 31 − 1mo → prior month last day). */
export function addMonthsToKstDate(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const targetMonthIndex = month + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDayOfMonth = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDayOfMonth)),
  );
}

export function formatKstTimestamp(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}${get("month")}${get("day")}_${get("hour")}${get("minute")}${get("second")}`;
}

export function buildNegativeStockMemo(timestamp: string): string {
  return `[자동화봇] ${timestamp}-음수재고빼기`;
}

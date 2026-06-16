import { getKstTodayDate } from "@/lib/date/kst-today";

function formatKstIsoDateCompact(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

export function buildShoplingInboundFilename(date = getKstTodayDate()): string {
  return `shopling_gross_inbound_${formatKstIsoDateCompact(date)}.xlsx`;
}

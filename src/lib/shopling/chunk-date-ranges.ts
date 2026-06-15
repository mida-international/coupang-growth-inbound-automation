import { getKstTodayDate } from "@/lib/date/kst-today";
import {
  addMonthsToKstDate,
  formatYyyyMmDd,
} from "@/lib/shopling/format-yyyymmdd";

export const SHOPLING_SYNC_CHUNK_MONTHS = 3;
export const SHOPLING_SYNC_MAX_CHUNKS = 40;
export const SHOPLING_SYNC_EMPTY_STOP = 5;

export type ShoplingDateChunk = {
  chunkIndex: number;
  startDt: string;
  endDt: string;
};

/**
 * chunk n: [today - (n+1)*3mo , today - n*3mo]
 * Boundaries touch: chunk(n).endDt === chunk(n-1).startDt
 */
export function buildShoplingSyncChunk(
  today: Date,
  chunkIndex: number,
): ShoplingDateChunk {
  const endDate = addMonthsToKstDate(
    today,
    -(chunkIndex * SHOPLING_SYNC_CHUNK_MONTHS),
  );
  const startDate = addMonthsToKstDate(endDate, -SHOPLING_SYNC_CHUNK_MONTHS);

  return {
    chunkIndex,
    startDt: formatYyyyMmDd(startDate),
    endDt: formatYyyyMmDd(endDate),
  };
}

export function buildShoplingSyncChunks(
  today: Date = getKstTodayDate(),
): ShoplingDateChunk[] {
  const chunks: ShoplingDateChunk[] = [];

  for (let chunkIndex = 0; chunkIndex < SHOPLING_SYNC_MAX_CHUNKS; chunkIndex++) {
    chunks.push(buildShoplingSyncChunk(today, chunkIndex));
  }

  return chunks;
}

import { getKstTodayDate } from "@/lib/date/kst-today";
import { prisma } from "@/lib/db";
import {
  SHOPLING_SYNC_CHUNK_MONTHS,
  SHOPLING_SYNC_EMPTY_STOP,
  SHOPLING_SYNC_MAX_CHUNKS,
} from "@/lib/shopling/chunk-date-ranges";
import { SHOPLING_SEARCH_TP } from "@/lib/shopling/constants";
import { formatYyyyMmDd } from "@/lib/shopling/format-yyyymmdd";
import { SHOPLING_INVENTORY_TABLE } from "@/lib/shopling/target";
import type { ShoplingSyncStatus } from "@/services/shopling-sync/types";

export async function getShoplingSyncStatus(): Promise<ShoplingSyncStatus> {
  const snapshotDate = getKstTodayDate();

  const [config, todayRowCount, lastIngestion] = await Promise.all([
    prisma.shoplingApiConfig.findUnique({
      where: { id: "default" },
      select: { id: true },
    }),
    prisma.shoplingInventory.count({
      where: { snapshotDate },
    }),
    prisma.ingestionLog.findFirst({
      where: { tableName: SHOPLING_INVENTORY_TABLE },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        rowCount: true,
        uploadedBy: {
          select: { name: true },
        },
      },
    }),
  ]);

  return {
    hasApiConfig: config !== null,
    snapshotDate: formatYyyyMmDd(snapshotDate),
    todayRowCount,
    syncPolicy: {
      chunkMonths: SHOPLING_SYNC_CHUNK_MONTHS,
      maxChunks: SHOPLING_SYNC_MAX_CHUNKS,
      emptyStop: SHOPLING_SYNC_EMPTY_STOP,
      searchTp: SHOPLING_SEARCH_TP,
    },
    lastIngestion: lastIngestion
      ? {
          createdAt: lastIngestion.createdAt.toISOString(),
          rowCount: lastIngestion.rowCount ?? 0,
          uploadedByName: lastIngestion.uploadedBy?.name ?? null,
        }
      : null,
  };
}

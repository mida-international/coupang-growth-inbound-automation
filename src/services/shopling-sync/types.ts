export type ShoplingSyncServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ShoplingSyncStoppedReason =
  | "empty_streak"
  | "max_chunks";

export type ShoplingSyncChunkResult = {
  chunkIndex: number;
  startDt: string;
  endDt: string;
  productCount: number;
  rowsMerged: number;
};

export type ShoplingSyncRunResult = {
  snapshotDate: string;
  oldestStartDt: string;
  newestEndDt: string;
  chunksProcessed: number;
  stoppedReason: ShoplingSyncStoppedReason;
  fetchedProductCount: number;
  rowCount: number;
  chunks: ShoplingSyncChunkResult[];
};

export type ShoplingSyncStatus = {
  hasApiConfig: boolean;
  snapshotDate: string;
  todayRowCount: number;
  syncPolicy: {
    chunkMonths: number;
    maxChunks: number;
    emptyStop: number;
    searchTp: string;
  };
  lastIngestion: {
    createdAt: string;
    rowCount: number;
    uploadedByName: string | null;
  } | null;
};

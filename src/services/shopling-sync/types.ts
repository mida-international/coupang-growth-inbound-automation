export type ShoplingSyncServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ShoplingSyncRunResult = {
  snapshotDate: string;
  startDt: string;
  endDt: string;
  fetchedProductCount: number;
  rowCount: number;
};

export type ShoplingSyncStatus = {
  hasApiConfig: boolean;
  snapshotDate: string;
  todayRowCount: number;
  verifyWindow: {
    startDt: string;
    endDt: string;
  };
  lastIngestion: {
    createdAt: string;
    rowCount: number;
    uploadedByName: string | null;
  } | null;
};

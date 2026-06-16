export type InboundRecordEvent = {
  productBarcode: string;
  quantity: number;
  recordedAt: Date;
};

export type InboundRotationStats = {
  rotation1Qty: number | null;
  rotation2Qty: number | null;
  rotation3Qty: number | null;
  rotation1Date: string | null;
  rotation2Date: string | null;
  rotation3Date: string | null;
};

export const EMPTY_INBOUND_ROTATION_STATS: InboundRotationStats = {
  rotation1Qty: null,
  rotation2Qty: null,
  rotation3Qty: null,
  rotation1Date: null,
  rotation2Date: null,
  rotation3Date: null,
};

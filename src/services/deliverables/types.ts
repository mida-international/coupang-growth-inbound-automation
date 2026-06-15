export type WarehouseInboundListRow = {
  location: string | null;
  registeredProductName: string | null;
  optionName: string | null;
  productBarcode: string | null;
  growthInboundRecommend: number;
};

export type WarehouseInboundListSnapshotDates = {
  template: string | null;
  shopling: string | null;
};

export type ListWarehouseInboundRowsResult = {
  snapshotDates: WarehouseInboundListSnapshotDates | null;
  rowCount: number;
  rows: WarehouseInboundListRow[];
};

import type { WarehouseInboundListRow } from "@/services/deliverables/types";

export type WarehouseInboundDeliverableItemCreate = {
  deliverableId: string;
  recordDate: Date;
  location: string | null;
  registeredProductName: string | null;
  optionName: string | null;
  productBarcode: string | null;
  quantity: number;
};

export function buildWarehouseInboundDeliverableItems(
  deliverableId: string,
  rows: WarehouseInboundListRow[],
  recordDate: Date,
): WarehouseInboundDeliverableItemCreate[] {
  return rows.map((row) => ({
    deliverableId,
    recordDate,
    location: row.location,
    registeredProductName: row.registeredProductName,
    optionName: row.optionName,
    productBarcode: row.productBarcode,
    quantity: row.growthInboundRecommend,
  }));
}

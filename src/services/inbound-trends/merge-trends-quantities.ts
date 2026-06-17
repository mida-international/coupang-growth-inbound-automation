import type { InboundTrendsDateValue } from "@/services/inbound-trends/types";

export type DailyQuantityRow = {
  product_barcode: string;
  record_date: Date;
  quantity: number;
};

export type TrendsQuantityMaps = {
  coupang: Map<string, Map<string, number>>;
  warehouse: Map<string, Map<string, number>>;
};

function formatRecordDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function normalizeBarcode(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildTrendsQuantityMaps(
  coupangRows: DailyQuantityRow[],
  warehouseRows: DailyQuantityRow[],
): TrendsQuantityMaps {
  const coupang = new Map<string, Map<string, number>>();
  const warehouse = new Map<string, Map<string, number>>();

  for (const row of coupangRows) {
    const barcode = normalizeBarcode(row.product_barcode);
    if (!barcode) {
      continue;
    }

    const dateKey = formatRecordDate(row.record_date);
    let byDate = coupang.get(barcode);

    if (!byDate) {
      byDate = new Map();
      coupang.set(barcode, byDate);
    }

    byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + row.quantity);
  }

  for (const row of warehouseRows) {
    const barcode = normalizeBarcode(row.product_barcode);
    if (!barcode) {
      continue;
    }

    const dateKey = formatRecordDate(row.record_date);
    let byDate = warehouse.get(barcode);

    if (!byDate) {
      byDate = new Map();
      warehouse.set(barcode, byDate);
    }

    byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + row.quantity);
  }

  return { coupang, warehouse };
}

export function mergeTrendsDateValues(
  productBarcode: string | null,
  dates: string[],
  maps: TrendsQuantityMaps,
): Record<string, InboundTrendsDateValue> {
  const barcode = normalizeBarcode(productBarcode);
  const coupangByDate = barcode ? maps.coupang.get(barcode) : undefined;
  const warehouseByDate = barcode ? maps.warehouse.get(barcode) : undefined;
  const result: Record<string, InboundTrendsDateValue> = {};

  for (const date of dates) {
    const coupangQty = coupangByDate?.get(date) ?? null;
    const warehouseQty = warehouseByDate?.get(date) ?? null;

    result[date] = {
      coupang: coupangQty,
      warehouse: warehouseQty,
    };
  }

  return result;
}

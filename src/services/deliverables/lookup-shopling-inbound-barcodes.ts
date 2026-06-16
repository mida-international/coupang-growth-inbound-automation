import { prisma } from "@/lib/db";
import {
  formatShoplingInboundLookupError,
  resolveShoplingInboundBarcodes,
  type ResolveShoplingInboundBarcodesResult,
  type ShoplingInboundInventoryRow,
} from "@/lib/deliverables/resolve-shopling-inbound-barcodes";
import type { ShoplingInboundListItem } from "@/lib/excel/parsers/parse-shopling-inbound-list";

export type {
  ShoplingInboundLookupIssue,
} from "@/lib/deliverables/resolve-shopling-inbound-barcodes";

export type LookupShoplingInboundBarcodesResult = ResolveShoplingInboundBarcodesResult;

export { formatShoplingInboundLookupError };

async function getLatestShoplingSnapshotDate(): Promise<Date> {
  const { _max } = await prisma.shoplingInventory.aggregate({
    _max: { snapshotDate: true },
  });

  const maxSnapshotDate = _max.snapshotDate;

  if (!maxSnapshotDate) {
    throw new Error(
      "샵플링 재고 데이터가 없습니다. 데이터 동기화에서 샵플링을 먼저 동기화해 주세요.",
    );
  }

  return maxSnapshotDate;
}

export async function loadShoplingInboundInventoryRows(options?: {
  includeLocation?: boolean;
}): Promise<ShoplingInboundInventoryRow[]> {
  const maxSnapshotDate = await getLatestShoplingSnapshotDate();

  return prisma.shoplingInventory.findMany({
    where: { snapshotDate: maxSnapshotDate },
    select: {
      ptnGoodsCd: true,
      productName: true,
      optionValue: true,
      barcode: true,
      ...(options?.includeLocation ? { location: true } : {}),
    },
  });
}

export async function lookupShoplingInboundBarcodes(
  items: ShoplingInboundListItem[],
): Promise<LookupShoplingInboundBarcodesResult> {
  const inventoryRows = await loadShoplingInboundInventoryRows();

  return resolveShoplingInboundBarcodes(items, inventoryRows);
}

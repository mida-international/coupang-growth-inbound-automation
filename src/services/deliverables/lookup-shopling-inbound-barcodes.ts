import { prisma } from "@/lib/db";
import {
  formatShoplingInboundLookupError,
  resolveShoplingInboundBarcodes,
  type ResolveShoplingInboundBarcodesResult,
} from "@/lib/deliverables/resolve-shopling-inbound-barcodes";
import type { ShoplingInboundListItem } from "@/lib/excel/parsers/parse-shopling-inbound-list";

export type {
  ShoplingInboundLookupIssue,
} from "@/lib/deliverables/resolve-shopling-inbound-barcodes";

export type LookupShoplingInboundBarcodesResult = ResolveShoplingInboundBarcodesResult;

export { formatShoplingInboundLookupError };

export async function lookupShoplingInboundBarcodes(
  items: ShoplingInboundListItem[],
): Promise<LookupShoplingInboundBarcodesResult> {
  const { _max } = await prisma.shoplingInventory.aggregate({
    _max: { snapshotDate: true },
  });

  const maxSnapshotDate = _max.snapshotDate;

  if (!maxSnapshotDate) {
    throw new Error(
      "샵플링 재고 데이터가 없습니다. 데이터 동기화에서 샵플링을 먼저 동기화해 주세요.",
    );
  }

  const inventoryRows = await prisma.shoplingInventory.findMany({
    where: { snapshotDate: maxSnapshotDate },
    select: {
      ptnGoodsCd: true,
      productName: true,
      optionValue: true,
      barcode: true,
    },
  });

  return resolveShoplingInboundBarcodes(items, inventoryRows);
}

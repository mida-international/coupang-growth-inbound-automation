import { prisma } from "@/lib/db";

export type ShoplingInboundRotationBatch = {
  recordedAt: Date;
  qtyByBarcode: Map<string, number>;
};

export async function loadShoplingInboundRotationBatches(
  limit: number,
): Promise<ShoplingInboundRotationBatch[]> {
  if (limit <= 0) {
    return [];
  }

  const deliverables = await prisma.shoplingInboundDeliverable.findMany({
    orderBy: { recordedAt: "desc" },
    take: limit,
    select: {
      recordedAt: true,
      items: {
        select: {
          barcode: true,
          quantity: true,
        },
      },
    },
  });

  return deliverables.map((deliverable) => {
    const qtyByBarcode = new Map<string, number>();

    for (const item of deliverable.items) {
      const barcode = item.barcode.trim();

      if (barcode.length === 0) {
        continue;
      }

      qtyByBarcode.set(barcode, item.quantity);
    }

    return {
      recordedAt: deliverable.recordedAt,
      qtyByBarcode,
    };
  });
}

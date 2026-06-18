import { prisma } from "@/lib/db";
import type {
  ListShoplingInboundDeliverablesResult,
  ShoplingInboundDeliverableListItem,
} from "@/services/deliverables/types";
import {
  normalizeShoplingInboundDeliverablePageSize,
} from "@/services/deliverables/types";

type RawDeliverableRow = {
  id: string;
  outputFileName: string;
  sourceFileName: string | null;
  recordedAt: Date;
  recordedBy: { name: string | null; email: string } | null;
  items: Array<{ barcode: string; quantity: number }>;
};

export function mapShoplingInboundDeliverableRow(
  row: RawDeliverableRow,
): ShoplingInboundDeliverableListItem {
  const barcodeCount = row.items.length;
  const totalQuantity = row.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: row.id,
    outputFileName: row.outputFileName,
    sourceFileName: row.sourceFileName,
    recordedAt: row.recordedAt.toISOString(),
    recordedByName: row.recordedBy?.name ?? row.recordedBy?.email ?? null,
    barcodeCount,
    totalQuantity,
    items: row.items.map((item) => ({
      barcode: item.barcode,
      quantity: item.quantity,
    })),
  };
}

type ListShoplingInboundDeliverablesOptions = {
  page?: number;
  pageSize?: number;
  exportAll?: boolean;
};

export async function listShoplingInboundDeliverables(
  options: ListShoplingInboundDeliverablesOptions = {},
): Promise<ListShoplingInboundDeliverablesResult> {
  const pageSize = normalizeShoplingInboundDeliverablePageSize(options.pageSize);
  const page = Math.max(1, options.page ?? 1);
  const exportAll = options.exportAll === true;
  const skip = (page - 1) * pageSize;

  const [rowCount, rows] = await Promise.all([
    prisma.shoplingInboundDeliverable.count(),
    prisma.shoplingInboundDeliverable.findMany({
      orderBy: { recordedAt: "desc" },
      ...(exportAll
        ? {}
        : {
            skip,
            take: pageSize,
          }),
      select: {
        id: true,
        outputFileName: true,
        sourceFileName: true,
        recordedAt: true,
        recordedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            barcode: true,
            quantity: true,
          },
          orderBy: { barcode: "asc" },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));

  return {
    rowCount,
    page,
    pageSize,
    totalPages,
    rows: rows.map(mapShoplingInboundDeliverableRow),
  };
}

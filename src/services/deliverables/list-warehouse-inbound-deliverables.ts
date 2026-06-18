import { prisma } from "@/lib/db";
import type {
  ListWarehouseInboundDeliverablesResult,
  WarehouseInboundDeliverableListItem,
} from "@/services/deliverables/types";
import { normalizeShoplingInboundDeliverablePageSize } from "@/services/deliverables/types";

type RawWarehouseInboundItem = {
  recordDate: Date;
  location: string | null;
  registeredProductName: string | null;
  optionName: string | null;
  productBarcode: string | null;
  quantity: number;
};

type RawWarehouseInboundDeliverableRow = {
  id: string;
  outputFileName: string;
  recordDate: Date;
  rotationCount: number;
  recordedAt: Date;
  coupangSellerAccount: { displayName: string };
  recordedBy: { name: string | null; email: string } | null;
  items: RawWarehouseInboundItem[];
};

function formatRecordDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function mapWarehouseInboundDeliverableRow(
  row: RawWarehouseInboundDeliverableRow,
): WarehouseInboundDeliverableListItem {
  const itemCount = row.items.length;
  const totalQuantity = row.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: row.id,
    outputFileName: row.outputFileName,
    recordDate: formatRecordDate(row.recordDate),
    rotationCount: row.rotationCount,
    sellerDisplayName: row.coupangSellerAccount.displayName,
    recordedAt: row.recordedAt.toISOString(),
    recordedByName: row.recordedBy?.name ?? row.recordedBy?.email ?? null,
    itemCount,
    totalQuantity,
    items: row.items.map((item) => ({
      recordDate: formatRecordDate(item.recordDate),
      location: item.location,
      registeredProductName: item.registeredProductName,
      optionName: item.optionName,
      productBarcode: item.productBarcode,
      quantity: item.quantity,
    })),
  };
}

type ListWarehouseInboundDeliverablesOptions = {
  page?: number;
  pageSize?: number;
  exportAll?: boolean;
};

export async function listWarehouseInboundDeliverables(
  options: ListWarehouseInboundDeliverablesOptions = {},
): Promise<ListWarehouseInboundDeliverablesResult> {
  const pageSize = normalizeShoplingInboundDeliverablePageSize(options.pageSize);
  const page = Math.max(1, options.page ?? 1);
  const exportAll = options.exportAll === true;
  const skip = (page - 1) * pageSize;

  const [rowCount, rows] = await Promise.all([
    prisma.warehouseInboundDeliverable.count(),
    prisma.warehouseInboundDeliverable.findMany({
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
        recordDate: true,
        rotationCount: true,
        recordedAt: true,
        coupangSellerAccount: {
          select: {
            displayName: true,
          },
        },
        recordedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            recordDate: true,
            location: true,
            registeredProductName: true,
            optionName: true,
            productBarcode: true,
            quantity: true,
          },
          orderBy: [{ productBarcode: "asc" }, { id: "asc" }],
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
    rows: rows.map(mapWarehouseInboundDeliverableRow),
  };
}

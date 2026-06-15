import { Prisma } from "@/generated/prisma/client";
import { getKstTodayDate } from "@/lib/date/kst-today";
import { parseInventoryHealth } from "@/lib/excel/parsers/parse-inventory-health";
import type { ParsedInventoryHealthRow } from "@/lib/excel/parsers/parse-inventory-health";
import { prisma } from "@/lib/db";
import { coupangGrowthInventoryHealthTarget } from "@/lib/excel/targets/coupang-growth-inventory-health";
import type {
  IngestInventoryHealthInput,
  IngestInventoryHealthResult,
  IngestServiceResult,
} from "@/services/coupang-growth-sync/types";

const CREATE_MANY_BATCH_SIZE = 1000;
const INGEST_TX_BASE_MS = 30_000;
const INGEST_TX_PER_BATCH_MS = 15_000;
const INGEST_TX_MAX_MS = 240_000;
const INGEST_TX_MAX_WAIT_MS = 10_000;

function computeIngestTransactionTimeoutMs(rowCount: number): number {
  const batches = Math.max(1, Math.ceil(rowCount / CREATE_MANY_BATCH_SIZE));

  return Math.min(
    INGEST_TX_BASE_MS + batches * INGEST_TX_PER_BATCH_MS,
    INGEST_TX_MAX_MS,
  );
}

function mapInventoryHealthRowToCreateInput(
  row: ParsedInventoryHealthRow,
  context: {
    ingestionId: bigint;
    coupangSellerAccountId: string;
    snapshotDate: Date;
  },
) {
  return {
    ingestionId: context.ingestionId,
    coupangSellerAccountId: context.coupangSellerAccountId,
    snapshotDate: context.snapshotDate,
    inventoryId: row.inventoryId,
    optionId: row.optionId,
    skuId: row.skuId,
    productName: row.productName,
    optionName: row.optionName,
    offerCondition: row.offerCondition,
    orderableQuantity: row.orderableQuantity,
    pendingInbounds: row.pendingInbounds,
    itemWinner: row.itemWinner,
    recentSales7days: row.recentSales7days,
    recentSales30days: row.recentSales30days,
    recentSalesQty7days: row.recentSalesQty7days,
    recentSalesQty30days: row.recentSalesQty30days,
    recommendedInboundQty: row.recommendedInboundQty,
    recommendedInboundDate: row.recommendedInboundDate,
    daysOfCover: row.daysOfCover,
    monthlyStorageFee: row.monthlyStorageFee,
    skuAge1_30: row.skuAge1_30,
    skuAge31_45: row.skuAge31_45,
    skuAge46_60: row.skuAge46_60,
    skuAge61_120: row.skuAge61_120,
    skuAge121_180: row.skuAge121_180,
    skuAge181Plus: row.skuAge181Plus,
    customerReturns30days: row.customerReturns30days,
    season: row.season,
    productListingDate: row.productListingDate,
  };
}

export async function ingestInventoryHealth(
  input: IngestInventoryHealthInput,
): Promise<IngestServiceResult<IngestInventoryHealthResult>> {
  const account = await prisma.coupangSellerAccount.findUnique({
    where: { id: input.coupangSellerAccountId },
    select: { id: true, isActive: true },
  });

  if (!account) {
    return { ok: false, error: "쿠팡 판매자 계정을 찾을 수 없습니다." };
  }

  if (!account.isActive) {
    return { ok: false, error: "비활성 쿠팡 판매자 계정은 업로드할 수 없습니다." };
  }

  const parsed = parseInventoryHealth(input.buffer);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const snapshotDate = getKstTodayDate();
  const txTimeout = computeIngestTransactionTimeoutMs(parsed.rows.length);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        await tx.coupangGrowthInventoryHealth.deleteMany({
          where: {
            coupangSellerAccountId: input.coupangSellerAccountId,
            snapshotDate,
          },
        });

        const ingestionLog = await tx.ingestionLog.create({
          data: {
            tableName: coupangGrowthInventoryHealthTarget.tableName,
            snapshotDate,
            operation: "reload",
            rowCount: parsed.rows.length,
            uploadedById: input.uploadedById,
            sourceFile: input.sourceFile,
          },
        });

        const rowContext = {
          ingestionId: ingestionLog.id,
          coupangSellerAccountId: input.coupangSellerAccountId,
          snapshotDate,
        };

        for (
          let offset = 0;
          offset < parsed.rows.length;
          offset += CREATE_MANY_BATCH_SIZE
        ) {
          const batch = parsed.rows.slice(offset, offset + CREATE_MANY_BATCH_SIZE);

          await tx.coupangGrowthInventoryHealth.createMany({
            data: batch.map((row) =>
              mapInventoryHealthRowToCreateInput(row, rowContext),
            ),
          });
        }

        return {
          ingestionId: ingestionLog.id,
          rowCount: parsed.rows.length,
          skippedRowCount: parsed.skippedRowCount,
        };
      },
      {
        maxWait: INGEST_TX_MAX_WAIT_MS,
        timeout: txTimeout,
      },
    );

    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, error: "데이터 적재에 실패했습니다." };
    }

    throw error;
  }
}

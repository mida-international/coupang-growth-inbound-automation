import { Prisma } from "@/generated/prisma/client";
import { getKstTodayDate } from "@/lib/date/kst-today";
import { parseInboundTemplate } from "@/lib/excel/parsers/parse-inbound-template";
import type { ParsedInboundTemplateRow } from "@/lib/excel/parsers/parse-inbound-template";
import { prisma } from "@/lib/db";
import { coupangGrowthInboundTemplateTarget } from "@/lib/excel/targets/coupang-growth-inbound-template";
import type {
  IngestInboundTemplateInput,
  IngestInboundTemplateResult,
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

function mapInboundTemplateRowToCreateInput(
  row: ParsedInboundTemplateRow,
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
    registeredProductName: row.registeredProductName,
    optionName: row.optionName,
    sellingPrice: row.sellingPrice,
    exposedProductId: row.exposedProductId,
    registeredProductId: row.registeredProductId,
    optionId: row.optionId,
    sellingMethod: row.sellingMethod,
    sales2025Total: row.sales2025Total,
    sales2026Total: row.sales2026Total,
    sales2026_03: row.sales2026_03,
    sales2026_04: row.sales2026_04,
    sales2026_05: row.sales2026_05,
    salesLast14days: row.salesLast14days,
    qtySold2weeks: row.qtySold2weeks,
    qtySold1week: row.qtySold1week,
    sellerFeeRate: row.sellerFeeRate,
    sellerFee: row.sellerFee,
    cfsEstimatedFee: row.cfsEstimatedFee,
    baseDiscount: row.baseDiscount,
    discountedEstimatedFee: row.discountedEstimatedFee,
    estSales2weeksByQty: row.estSales2weeksByQty,
    shelfLifeDaysInput: row.shelfLifeDaysInput,
    expiryDate: row.expiryDate,
    manufactureDate: row.manufactureDate,
    productionYear: row.productionYear,
    productBarcode: row.productBarcode,
    productSize: row.productSize,
    handleWithCare: row.handleWithCare,
    availableStock: row.availableStock,
    estStockoutDate: row.estStockoutDate,
    category: row.category,
    parallelImport: row.parallelImport,
    taxType: row.taxType,
    skuId: row.skuId,
    reqExpDate: row.reqExpDate,
    reqManDate: row.reqManDate,
    reqProdYear: row.reqProdYear,
  };
}

export async function ingestInboundTemplate(
  input: IngestInboundTemplateInput,
): Promise<IngestServiceResult<IngestInboundTemplateResult>> {
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

  const parsed = parseInboundTemplate(input.buffer);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const snapshotDate = getKstTodayDate();
  const txTimeout = computeIngestTransactionTimeoutMs(parsed.rows.length);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        await tx.coupangGrowthInboundTemplate.deleteMany({
          where: {
            coupangSellerAccountId: input.coupangSellerAccountId,
            snapshotDate,
          },
        });

        const ingestionLog = await tx.ingestionLog.create({
          data: {
            tableName: coupangGrowthInboundTemplateTarget.tableName,
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

          await tx.coupangGrowthInboundTemplate.createMany({
            data: batch.map((row) =>
              mapInboundTemplateRowToCreateInput(row, rowContext),
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

import { aggregateMatchedInboundItems } from "@/lib/deliverables/aggregate-matched-inbound-items";
import { prisma } from "@/lib/db";
import { generateCoupangInboundTemplate } from "@/services/deliverables/generate-coupang-inbound-template";
import type {
  RecordCoupangInboundInput,
  RecordCoupangInboundResult,
} from "@/services/deliverables/types";

function parseCoupangOptionId(value: string | null): bigint | null {
  if (!value) {
    return null;
  }

  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

export async function recordCoupangInbound(
  input: RecordCoupangInboundInput,
): Promise<RecordCoupangInboundResult> {
  const generated = await generateCoupangInboundTemplate({
    templateBuffer: input.templateBuffer,
    boxListInput: input.boxListInput,
  });

  const aggregated = aggregateMatchedInboundItems(generated.matchedItems);

  if (aggregated.length === 0) {
    throw new Error("기록할 입고 수량이 없습니다.");
  }

  const batchId = crypto.randomUUID();

  await prisma.coupangInboundRecord.createMany({
    data: aggregated.map((item) => ({
      coupangSellerAccountId: input.coupangSellerAccountId,
      productBarcode: item.productBarcode,
      coupangOptionId: parseCoupangOptionId(item.coupangOptionId),
      quantity: item.quantity,
      recordedById: input.recordedById,
      batchId,
    })),
  });

  return {
    batchId,
    recordedCount: aggregated.length,
    matchedBarcodeCount: aggregated.length,
  };
}

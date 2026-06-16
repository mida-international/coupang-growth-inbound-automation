import {
  aggregateOutboundDeductRows,
  type AggregatedOutboundDeductRow,
} from "@/lib/deliverables/aggregate-outbound-deduct-rows";
import { buildShoplingInboundFilename } from "@/lib/excel/generators/build-shopling-inbound-filename";
import { prisma } from "@/lib/db";
import { generateShoplingInboundTemplate } from "@/services/deliverables/generate-shopling-inbound-template";
import { saveShoplingInboundDeliverableFile } from "@/services/deliverables/save-shopling-inbound-deliverable-file";
import type {
  RecordShoplingInboundDeliverableInput,
  RecordShoplingInboundDeliverableResult,
} from "@/services/deliverables/types";

export function buildShoplingInboundDeliverableItemCreates(
  deliverableId: string,
  aggregated: AggregatedOutboundDeductRow[],
) {
  return aggregated.map((item) => ({
    deliverableId,
    barcode: item.barcode,
    quantity: item.quantity,
  }));
}

export async function recordShoplingInboundDeliverable(
  input: RecordShoplingInboundDeliverableInput,
): Promise<RecordShoplingInboundDeliverableResult> {
  const generated = await generateShoplingInboundTemplate({
    inboundListBuffer: input.inboundListBuffer,
  });

  const aggregated = aggregateOutboundDeductRows(generated.rows);

  if (aggregated.length === 0) {
    throw new Error("기록할 입고 수량이 없습니다.");
  }

  const deliverableId = crypto.randomUUID();
  const outputFileName = buildShoplingInboundFilename();

  const storagePath = await saveShoplingInboundDeliverableFile({
    deliverableId,
    outputFileName,
    buffer: generated.buffer,
  });

  await prisma.$transaction(async (tx) => {
    await tx.shoplingInboundDeliverable.create({
      data: {
        id: deliverableId,
        storagePath,
        outputFileName,
        sourceFileName: input.sourceFileName?.trim() || null,
        recordedById: input.recordedById,
      },
    });

    await tx.shoplingInboundDeliverableItem.createMany({
      data: buildShoplingInboundDeliverableItemCreates(
        deliverableId,
        aggregated,
      ),
    });
  });

  return {
    deliverableId,
    recordedCount: aggregated.length,
  };
}

import "server-only";

import { aggregateMatchedInboundItems } from "@/lib/deliverables/aggregate-matched-inbound-items";
import { buildCoupangInboundTemplateFilename } from "@/lib/excel/generators/filter-inbound-template";
import { prisma } from "@/lib/db";
import {
  buildCoupangInboundDeliverableItemCreates,
  buildCoupangInboundRecordCreates,
} from "@/services/deliverables/build-coupang-inbound-deliverable-items";
import { saveCoupangInboundDeliverableFile } from "@/services/deliverables/save-coupang-inbound-deliverable-file";
import type { RecordCoupangInboundResult } from "@/services/deliverables/types";
import type { VisionExtractedData } from "@/lib/vision/types";
import { generateCoupangInboundFromVision } from "@/services/vision-box-list/generate-coupang-inbound-from-vision";

export async function recordCoupangInboundFromVision(input: {
  coupangSellerAccountId: string;
  recordedById: string;
  templateBuffer: Buffer;
  visionData: VisionExtractedData;
  sourceFileName?: string | null;
}): Promise<RecordCoupangInboundResult> {
  const generated = await generateCoupangInboundFromVision({
    templateBuffer: input.templateBuffer,
    visionData: input.visionData,
  });

  const aggregated = aggregateMatchedInboundItems(generated.matchedItems);

  if (aggregated.length === 0) {
    throw new Error("기록할 입고 수량이 없습니다.");
  }

  const deliverableId = crypto.randomUUID();
  const outputFileName = buildCoupangInboundTemplateFilename("image");

  const storagePath = await saveCoupangInboundDeliverableFile({
    deliverableId,
    buffer: generated.buffer,
  });

  const itemCreates = buildCoupangInboundDeliverableItemCreates(
    deliverableId,
    aggregated,
  );
  const recordCreates = buildCoupangInboundRecordCreates(
    deliverableId,
    input.coupangSellerAccountId,
    input.recordedById,
    aggregated,
  );

  await prisma.$transaction(async (tx) => {
    await tx.coupangInboundDeliverable.create({
      data: {
        id: deliverableId,
        coupangSellerAccountId: input.coupangSellerAccountId,
        storagePath,
        outputFileName,
        sourceFileName: input.sourceFileName?.trim() || null,
        matchedCount: generated.stats.matched,
        unmatchedCount: generated.stats.unmatched.length,
        recordedById: input.recordedById,
      },
    });

    await tx.coupangInboundDeliverableItem.createMany({
      data: itemCreates,
    });

    await tx.coupangInboundRecord.createMany({
      data: recordCreates,
    });
  });

  return {
    deliverableId,
    batchId: deliverableId,
    recordedCount: aggregated.length,
    matchedBarcodeCount: aggregated.length,
  };
}

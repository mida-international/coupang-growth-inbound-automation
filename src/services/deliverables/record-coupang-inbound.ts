import { aggregateMatchedInboundItems } from "@/lib/deliverables/aggregate-matched-inbound-items";
import { buildCoupangInboundTemplateFilename } from "@/lib/excel/generators/filter-inbound-template";
import { prisma } from "@/lib/db";
import {
  buildCoupangInboundDeliverableItemCreates,
  buildCoupangInboundRecordCreates,
} from "@/services/deliverables/build-coupang-inbound-deliverable-items";
import { generateCoupangInboundTemplate } from "@/services/deliverables/generate-coupang-inbound-template";
import { saveCoupangInboundDeliverableFile } from "@/services/deliverables/save-coupang-inbound-deliverable-file";
import type {
  RecordCoupangInboundInput,
  RecordCoupangInboundResult,
} from "@/services/deliverables/types";

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

  const deliverableId = crypto.randomUUID();
  const outputFileName = buildCoupangInboundTemplateFilename(
    generated.stats.source,
  );

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
        sourceFingerprint: input.sourceFingerprint ?? null,
        ...(input.sourceFiles && input.sourceFiles.length > 0
          ? { sourceFiles: input.sourceFiles }
          : {}),
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

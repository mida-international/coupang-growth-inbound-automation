import { getKstTodayDate } from "@/lib/date/kst-today";
import { prisma } from "@/lib/db";
import { buildWarehouseInboundDeliverableItems } from "@/services/deliverables/build-warehouse-inbound-deliverable-items";
import { generateWarehouseInboundListContext } from "@/services/deliverables/generate-warehouse-inbound-list-context";
import { saveWarehouseInboundDeliverableFile } from "@/services/deliverables/save-warehouse-inbound-deliverable-file";
import type {
  RecordWarehouseInboundDeliverableInput,
  RecordWarehouseInboundDeliverableResult,
} from "@/services/deliverables/types";

export async function recordWarehouseInboundDeliverable(
  input: RecordWarehouseInboundDeliverableInput,
): Promise<RecordWarehouseInboundDeliverableResult> {
  const context = await generateWarehouseInboundListContext(
    input.coupangSellerAccountId,
    input.rotation,
  );

  const deliverableId = crypto.randomUUID();
  const recordDate = getKstTodayDate();

  const storagePath = await saveWarehouseInboundDeliverableFile({
    deliverableId,
    buffer: context.buffer,
  });

  const itemCreates = buildWarehouseInboundDeliverableItems(
    deliverableId,
    context.listResult.rows,
    recordDate,
  );

  await prisma.$transaction(async (tx) => {
    await tx.warehouseInboundDeliverable.create({
      data: {
        id: deliverableId,
        coupangSellerAccountId: input.coupangSellerAccountId,
        storagePath,
        outputFileName: context.outputFileName,
        recordDate,
        rotationCount: input.rotation,
        recordedById: input.recordedById,
      },
    });

    if (itemCreates.length > 0) {
      await tx.warehouseInboundDeliverableItem.createMany({
        data: itemCreates,
      });
    }
  });

  return {
    deliverableId,
    recordedCount: itemCreates.length,
    buffer: context.buffer,
    outputFileName: context.outputFileName,
  };
}

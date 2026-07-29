import { getKstTodayDate } from "@/lib/date/kst-today";
import { prisma } from "@/lib/db";
import { deleteExcelFile } from "@/lib/supabase/storage";
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

  // 같은 날 기존 기록은 지우고 갱신한다 (추세 집계가 SUM이라 중복 기록 시 이중 합산됨)
  const existing = await prisma.warehouseInboundDeliverable.findMany({
    where: {
      coupangSellerAccountId: input.coupangSellerAccountId,
      recordDate,
    },
    select: { id: true, storagePath: true },
  });

  await prisma.$transaction(async (tx) => {
    if (existing.length > 0) {
      await tx.warehouseInboundDeliverable.deleteMany({
        where: { id: { in: existing.map((row) => row.id) } },
      });
    }

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

  // DB 삭제 우선 — 이전 기록의 저장 파일은 best-effort 정리
  await Promise.all(
    existing.map((row) =>
      deleteExcelFile(row.storagePath).catch(() => undefined),
    ),
  );

  return {
    deliverableId,
    recordedCount: itemCreates.length,
    replacedCount: existing.length,
  };
}

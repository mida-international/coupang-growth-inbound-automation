import { downloadExcelFile } from "@/lib/supabase/storage";
import { prisma } from "@/lib/db";
import type {
  WarehouseInboundDeliverableFile,
  WarehouseInboundDeliverableServiceResult,
} from "@/services/deliverables/types";

export async function getWarehouseInboundDeliverableFile(
  id: string,
): Promise<WarehouseInboundDeliverableServiceResult<WarehouseInboundDeliverableFile>> {
  if (!id.trim()) {
    return { ok: false, error: "id는 필수입니다." };
  }

  const deliverable = await prisma.warehouseInboundDeliverable.findUnique({
    where: { id },
    select: {
      outputFileName: true,
      storagePath: true,
    },
  });

  if (!deliverable) {
    return { ok: false, error: "입고리스트 기록을 찾을 수 없습니다." };
  }

  const buffer = await downloadExcelFile(deliverable.storagePath);

  if (!buffer) {
    return { ok: false, error: "저장된 엑셀 파일을 찾을 수 없습니다." };
  }

  return {
    ok: true,
    data: {
      outputFileName: deliverable.outputFileName,
      buffer,
    },
  };
}

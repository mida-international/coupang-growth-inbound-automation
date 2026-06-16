import { deleteExcelFile, downloadExcelFile } from "@/lib/supabase/storage";
import { prisma } from "@/lib/db";
import type { ShoplingInboundDeliverableServiceResult } from "@/services/deliverables/types";

export async function deleteShoplingInboundDeliverable(
  id: string,
): Promise<ShoplingInboundDeliverableServiceResult<void>> {
  if (!id.trim()) {
    return { ok: false, error: "id는 필수입니다." };
  }

  const deliverable = await prisma.shoplingInboundDeliverable.findUnique({
    where: { id },
    select: {
      id: true,
      storagePath: true,
    },
  });

  if (!deliverable) {
    return { ok: false, error: "입고 기록을 찾을 수 없습니다." };
  }

  const existingFile = await downloadExcelFile(deliverable.storagePath);

  if (existingFile) {
    try {
      await deleteExcelFile(deliverable.storagePath);
    } catch {
      return { ok: false, error: "엑셀 파일 삭제에 실패했습니다." };
    }
  }

  try {
    await prisma.shoplingInboundDeliverable.delete({ where: { id } });
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "입고 기록 삭제에 실패했습니다." };
  }
}

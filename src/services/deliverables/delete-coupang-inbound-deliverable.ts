import { deleteExcelFile } from "@/lib/supabase/storage";
import { prisma } from "@/lib/db";
import { deleteCoupangInboundDeliverableFromDb } from "@/services/deliverables/delete-coupang-inbound-deliverable-db";
import type { CoupangInboundDeliverableServiceResult } from "@/services/deliverables/types";

export async function deleteCoupangInboundDeliverable(
  id: string,
): Promise<CoupangInboundDeliverableServiceResult<void>> {
  if (!id.trim()) {
    return { ok: false, error: "id는 필수입니다." };
  }

  const deliverable = await prisma.coupangInboundDeliverable.findUnique({
    where: { id },
    select: {
      id: true,
      storagePath: true,
    },
  });

  if (!deliverable) {
    return { ok: false, error: "입고리스트 기록을 찾을 수 없습니다." };
  }

  try {
    await deleteCoupangInboundDeliverableFromDb(id, prisma);
  } catch {
    return { ok: false, error: "입고리스트 기록 삭제에 실패했습니다." };
  }

  try {
    await deleteExcelFile(deliverable.storagePath);
  } catch {
    // DB 삭제 우선 — Storage 파일은 best-effort 정리
  }

  return { ok: true, data: undefined };
}

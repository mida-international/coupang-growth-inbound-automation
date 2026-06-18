import { prisma } from "@/lib/db";
import type {
  CenterSeparationServiceResult,
  DeleteCenterSeparationResult,
} from "@/services/center-separation/types";

export async function deleteCenterSeparationBarcodes(
  ids: string[],
): Promise<CenterSeparationServiceResult<DeleteCenterSeparationResult>> {
  const validIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  if (validIds.length === 0) {
    return { ok: false, error: "삭제할 항목을 선택해 주세요." };
  }

  try {
    const result = await prisma.coupangCenterSeparation.deleteMany({
      where: { id: { in: validIds } },
    });

    return { ok: true, data: { deletedCount: result.count } };
  } catch {
    return { ok: false, error: "센터분리 바코드 삭제에 실패했습니다." };
  }
}

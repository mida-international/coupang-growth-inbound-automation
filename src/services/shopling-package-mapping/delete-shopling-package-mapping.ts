import { prisma } from "@/lib/db";
import type { ShoplingPackageMappingServiceResult } from "@/services/shopling-package-mapping/types";

export async function deleteShoplingPackageMapping(
  id: string,
): Promise<ShoplingPackageMappingServiceResult<void>> {
  if (!id.trim()) {
    return { ok: false, error: "id는 필수입니다." };
  }

  const existing = await prisma.shoplingPackageMapping.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return { ok: false, error: "패키지 매핑을 찾을 수 없습니다." };
  }

  try {
    await prisma.shoplingPackageMapping.delete({ where: { id } });
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "패키지 매핑 삭제에 실패했습니다." };
  }
}

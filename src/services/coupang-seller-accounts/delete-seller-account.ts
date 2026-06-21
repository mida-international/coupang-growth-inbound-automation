import { prisma } from "@/lib/db";
import {
  deleteExcelFile,
  getInboundTemplateStoragePath,
} from "@/lib/supabase/storage";
import type { SellerAccountsResult } from "@/services/coupang-seller-accounts/types";

type DeletedSellerAccount = {
  id: string;
  displayName: string;
};

async function hasDeleteBlockers(accountId: string): Promise<boolean> {
  const [
    inboundTemplateCount,
    inventoryHealthCount,
    coupangDeliverableCount,
    warehouseDeliverableCount,
  ] = await Promise.all([
    prisma.coupangGrowthInboundTemplate.count({
      where: { coupangSellerAccountId: accountId },
    }),
    prisma.coupangGrowthInventoryHealth.count({
      where: { coupangSellerAccountId: accountId },
    }),
    prisma.coupangInboundDeliverable.count({
      where: { coupangSellerAccountId: accountId },
    }),
    prisma.warehouseInboundDeliverable.count({
      where: { coupangSellerAccountId: accountId },
    }),
  ]);

  return (
    inboundTemplateCount > 0 ||
    inventoryHealthCount > 0 ||
    coupangDeliverableCount > 0 ||
    warehouseDeliverableCount > 0
  );
}

export async function deleteSellerAccount(
  accountId: string,
): Promise<SellerAccountsResult<DeletedSellerAccount>> {
  const existing = await prisma.coupangSellerAccount.findUnique({
    where: { id: accountId },
    select: { id: true, displayName: true },
  });

  if (!existing) {
    return { ok: false, error: "판매자 계정을 찾을 수 없습니다." };
  }

  if (await hasDeleteBlockers(accountId)) {
    return {
      ok: false,
      error:
        "연결된 데이터(템플릿·재고·산출물 등)가 있어 삭제할 수 없습니다.",
    };
  }

  try {
    await prisma.coupangSellerAccount.delete({
      where: { id: accountId },
    });
  } catch {
    return { ok: false, error: "판매자 계정 삭제에 실패했습니다." };
  }

  try {
    await deleteExcelFile(getInboundTemplateStoragePath(accountId));
  } catch {
    // Storage 정리 실패는 DB 삭제 성공 후 무시합니다.
  }

  return {
    ok: true,
    data: {
      id: existing.id,
      displayName: existing.displayName,
    },
  };
}

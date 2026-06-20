import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MembersResult } from "@/services/members/types";

type DeletedMember = {
  id: string;
  email: string;
};

async function hasDeleteBlockers(profileId: string): Promise<boolean> {
  const [
    sellerAccountCount,
    planningOverrideCount,
    inboundRecordCount,
    coupangDeliverableCount,
    shoplingDeliverableCount,
    warehouseDeliverableCount,
  ] = await Promise.all([
    prisma.coupangSellerAccount.count({ where: { createdById: profileId } }),
    prisma.inboundPlanningOverride.count({ where: { updatedById: profileId } }),
    prisma.coupangInboundRecord.count({ where: { recordedById: profileId } }),
    prisma.coupangInboundDeliverable.count({
      where: { recordedById: profileId },
    }),
    prisma.shoplingInboundDeliverable.count({
      where: { recordedById: profileId },
    }),
    prisma.warehouseInboundDeliverable.count({
      where: { recordedById: profileId },
    }),
  ]);

  return (
    sellerAccountCount > 0 ||
    planningOverrideCount > 0 ||
    inboundRecordCount > 0 ||
    coupangDeliverableCount > 0 ||
    shoplingDeliverableCount > 0 ||
    warehouseDeliverableCount > 0
  );
}

export async function deleteMember(
  targetId: string,
  actorId: string
): Promise<MembersResult<DeletedMember>> {
  if (targetId === actorId) {
    return { ok: false, error: "본인 계정은 삭제할 수 없습니다." };
  }

  const existing = await prisma.profile.findUnique({
    where: { id: targetId },
  });

  if (!existing) {
    return { ok: false, error: "프로필을 찾을 수 없습니다." };
  }

  if (existing.role === "master") {
    const masterCount = await prisma.profile.count({
      where: { role: "master" },
    });

    if (masterCount <= 1) {
      return { ok: false, error: "마지막 시스템 계정은 삭제할 수 없습니다." };
    }
  }

  if (await hasDeleteBlockers(targetId)) {
    return {
      ok: false,
      error: "판매자 계정 또는 업무 기록이 있어 삭제할 수 없습니다.",
    };
  }

  try {
    await prisma.profile.delete({
      where: { id: targetId },
    });
  } catch {
    return { ok: false, error: "프로필 삭제에 실패했습니다." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(targetId);

  if (error) {
    return { ok: false, error: "인증 계정 삭제에 실패했습니다." };
  }

  return {
    ok: true,
    data: {
      id: existing.id,
      email: existing.email,
    },
  };
}

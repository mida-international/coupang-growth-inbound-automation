import { getKstTodayDate } from "@/lib/date/kst-today";
import { prisma } from "@/lib/db";
import { parseCoupangInboundSourceFiles } from "@/lib/deliverables/coupang-inbound-source";

/** 같은 원본으로 이미 기록된 쿠팡 입고 기록 (중복 경고용) */
export type DuplicateCoupangInboundDeliverable = {
  id: string;
  recordedAt: string;
  recordedByName: string;
  sourceFileName: string | null;
  outputFileName: string;
  sourceFiles: { index: number; name: string; stored: boolean }[];
};

const MAX_DUPLICATES = 5;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 오늘(KST) 0시의 실제 시각 */
function getKstTodayStart(): Date {
  return new Date(getKstTodayDate().getTime() - KST_OFFSET_MS);
}

/** 오늘(KST) 같은 계정에 같은 원본(파일/이미지)으로 기록된 쿠팡 입고 기록을 찾는다. */
export async function findDuplicateCoupangInboundDeliverables(
  coupangSellerAccountId: string,
  sourceFingerprint: string,
): Promise<DuplicateCoupangInboundDeliverable[]> {
  const rows = await prisma.coupangInboundDeliverable.findMany({
    where: {
      coupangSellerAccountId,
      sourceFingerprint,
      recordedAt: { gte: getKstTodayStart() },
    },
    orderBy: { recordedAt: "desc" },
    take: MAX_DUPLICATES,
    select: {
      id: true,
      recordedAt: true,
      sourceFileName: true,
      outputFileName: true,
      sourceFiles: true,
      recordedBy: { select: { name: true, email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    recordedAt: row.recordedAt.toISOString(),
    recordedByName: row.recordedBy.name?.trim() || row.recordedBy.email,
    sourceFileName: row.sourceFileName,
    outputFileName: row.outputFileName,
    sourceFiles: parseCoupangInboundSourceFiles(row.sourceFiles).map(
      (file, index) => ({
        index,
        name: file.name,
        stored: file.storagePath !== null,
      }),
    ),
  }));
}

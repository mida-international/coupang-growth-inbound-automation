import { prisma } from "@/lib/db";
import type { VisionExtractedData } from "@/lib/vision/types";

type GetTelegramBoxListUploadVisionDataResult =
  | { ok: true; data: { visionData: VisionExtractedData | null } }
  | { ok: false; error: string };

function isVisionExtractedData(value: unknown): value is VisionExtractedData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { columns?: unknown; rows?: unknown };
  return Array.isArray(candidate.columns) && Array.isArray(candidate.rows);
}

export async function getTelegramBoxListUploadVisionData(
  id: string,
): Promise<GetTelegramBoxListUploadVisionDataResult> {
  if (!id.trim()) {
    return { ok: false, error: "id는 필수입니다." };
  }

  const upload = await prisma.telegramBoxListUpload.findUnique({
    where: { id },
    select: {
      id: true,
      visionData: true,
    },
  });

  if (!upload) {
    return { ok: false, error: "업로드 기록을 찾을 수 없습니다." };
  }

  return {
    ok: true,
    data: {
      visionData: isVisionExtractedData(upload.visionData)
        ? upload.visionData
        : null,
    },
  };
}

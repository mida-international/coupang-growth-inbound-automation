import { createHash } from "node:crypto";

import { prisma } from "@/lib/db";
import {
  parseCoupangInboundSourceFiles,
  type CoupangInboundSourceFile,
} from "@/lib/deliverables/coupang-inbound-source";
import {
  downloadExcelFile,
  getCoupangInboundSourceStoragePath,
  uploadExcelFile,
} from "@/lib/supabase/storage";
import type { CoupangInboundDeliverableServiceResult } from "@/services/deliverables/types";

/**
 * 기록하기 후 원본 파일(엑셀/이미지) 1개를 Storage에 저장하고 source_files에 경로를 남긴다.
 * 기록 때 받은 해시와 같은 파일만 받는다.
 */
export async function saveCoupangInboundSourceFile(input: {
  deliverableId: string;
  index: number;
  buffer: Buffer;
}): Promise<CoupangInboundDeliverableServiceResult<{ storagePath: string }>> {
  const deliverable = await prisma.coupangInboundDeliverable.findUnique({
    where: { id: input.deliverableId },
    select: { sourceFiles: true },
  });

  if (!deliverable) {
    return { ok: false, error: "입고리스트 기록을 찾을 수 없습니다." };
  }

  const sourceFiles = parseCoupangInboundSourceFiles(deliverable.sourceFiles);
  const target = sourceFiles[input.index];

  if (!target) {
    return { ok: false, error: "원본 파일 정보를 찾을 수 없습니다." };
  }

  const sha256 = createHash("sha256").update(input.buffer).digest("hex");

  if (sha256 !== target.sha256) {
    return { ok: false, error: "기록 때와 다른 파일입니다." };
  }

  const storagePath = getCoupangInboundSourceStoragePath(
    input.deliverableId,
    input.index,
    target.name,
  );

  await uploadExcelFile(
    storagePath,
    input.buffer,
    target.contentType || "application/octet-stream",
    { upsert: true },
  );

  const updated: CoupangInboundSourceFile[] = sourceFiles.map((file, index) =>
    index === input.index ? { ...file, storagePath } : file,
  );

  await prisma.coupangInboundDeliverable.update({
    where: { id: input.deliverableId },
    data: { sourceFiles: updated },
  });

  return { ok: true, data: { storagePath } };
}

export async function getCoupangInboundSourceFile(
  deliverableId: string,
  index: number,
): Promise<
  CoupangInboundDeliverableServiceResult<{
    buffer: Buffer;
    name: string;
    contentType: string;
  }>
> {
  const deliverable = await prisma.coupangInboundDeliverable.findUnique({
    where: { id: deliverableId },
    select: { sourceFiles: true },
  });

  const file = deliverable
    ? parseCoupangInboundSourceFiles(deliverable.sourceFiles)[index]
    : undefined;

  if (!file?.storagePath) {
    return { ok: false, error: "저장된 원본 파일이 없습니다." };
  }

  const buffer = await downloadExcelFile(file.storagePath);

  if (!buffer) {
    return { ok: false, error: "원본 파일을 불러오지 못했습니다." };
  }

  return {
    ok: true,
    data: {
      buffer,
      name: file.name,
      contentType: file.contentType || "application/octet-stream",
    },
  };
}

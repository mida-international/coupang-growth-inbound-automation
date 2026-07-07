import "server-only";

import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";
import {
  downloadTelegramFile,
  getTelegramFile,
  sendTelegramMessage,
} from "@/lib/telegram/client";
import type { TelegramPhotoMessage } from "@/lib/telegram/parse-update";
import {
  BOX_LIST_EXCEL_CONTENT_TYPE,
  buildBoxListExcelBuffer,
  buildBoxListExcelFilename,
} from "@/lib/vision/build-box-list-excel-buffer";
import { extractBoxListFromImages } from "@/lib/vision/extract-box-list-from-images";
import type { VisionImageInput } from "@/lib/vision/extract-with-gemini";
import {
  getTelegramBoxListStoragePath,
  uploadExcelFile,
} from "@/lib/supabase/storage";

/** 여러 장(앨범)이든 한 장이든 동일하게 "하나의 산출물"로 처리하는 작업 단위. */
export type TelegramBoxListJob = {
  chatId: string;
  /** 완료/실패 알림을 달아줄 대상 메시지 (앨범이면 첫 장) */
  replyToMessageId: number;
  /** 중복 처리 방지용 고유 update id (앨범이면 첫 장의 update id) */
  updateId: number | bigint;
  userName: string | null;
  caption: string;
  fileIds: string[];
  mimeType: string;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function downloadTelegramImages(
  fileIds: string[],
  mimeType: string,
): Promise<VisionImageInput[]> {
  const images: VisionImageInput[] = [];

  for (const fileId of fileIds) {
    const file = await getTelegramFile(fileId);

    if (!file.file_path) {
      throw new Error("Telegram 파일 경로를 가져오지 못했습니다.");
    }

    const buffer = await downloadTelegramFile(file.file_path);
    images.push({ buffer, mimeType });
  }

  return images;
}

export async function processTelegramBoxList(
  job: TelegramBoxListJob,
): Promise<"processed" | "duplicate"> {
  // 같은 사진이 재전송(리트라이)되면 file_id가 동일하므로 중복 제거된다.
  const fileIds = [...new Set(job.fileIds)];

  if (fileIds.length === 0) {
    throw new Error("처리할 이미지가 없습니다.");
  }

  const uploadId = crypto.randomUUID();
  const outputFileName = buildBoxListExcelFilename("telegram-box-list");

  try {
    await prisma.telegramBoxListUpload.create({
      data: {
        id: uploadId,
        outputFileName,
        telegramChatId: job.chatId,
        telegramMessageId: BigInt(job.replyToMessageId),
        telegramUpdateId: BigInt(job.updateId),
        telegramUserName: job.userName,
        telegramCaption: job.caption,
        imageCount: fileIds.length,
        status: "processing",
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return "duplicate";
    }

    throw error;
  }

  // 처리 시작 즉시 "작업 중" 알림 (완료/실패 메시지와 별도)
  await sendTelegramMessage({
    chatId: job.chatId,
    text:
      fileIds.length > 1
        ? `🔄 이미지 ${fileIds.length}장을 받았어요. OCR 변환 작업 중입니다… 잠시만 기다려 주세요.`
        : "🔄 이미지를 받았어요. OCR 변환 작업 중입니다… 잠시만 기다려 주세요.",
    replyToMessageId: job.replyToMessageId,
  }).catch(() => undefined);

  try {
    const images = await downloadTelegramImages(fileIds, job.mimeType);
    const result = await extractBoxListFromImages(images);
    const excelBuffer = buildBoxListExcelBuffer(result.visionData);
    const storagePath = getTelegramBoxListStoragePath(uploadId);

    await uploadExcelFile(storagePath, excelBuffer, BOX_LIST_EXCEL_CONTENT_TYPE);

    const rowCount = result.stats.validBarcodeRows;

    await prisma.telegramBoxListUpload.update({
      where: { id: uploadId },
      data: {
        storagePath,
        rowCount,
        imageCount: result.stats.imageCount,
        status: "completed",
        completedAt: new Date(),
      },
    });

    await sendTelegramMessage({
      chatId: job.chatId,
      text: `✅ OCR 완료 · ${rowCount}행 · 자동화 > 텔레그램에서 다운로드`,
      replyToMessageId: job.replyToMessageId,
    });

    return "processed";
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "OCR 처리에 실패했습니다.";

    await prisma.telegramBoxListUpload
      .update({
        where: { id: uploadId },
        data: {
          status: "failed",
          errorMessage,
          completedAt: new Date(),
        },
      })
      .catch(() => undefined);

    await sendTelegramMessage({
      chatId: job.chatId,
      text: `❌ OCR 실패: ${errorMessage.slice(0, 200)}`,
      replyToMessageId: job.replyToMessageId,
    }).catch(() => undefined);

    throw error;
  }
}

/** 단일 사진(앨범 아님) 메시지 처리 — 얇은 래퍼. */
export async function processTelegramPhotoMessage(
  message: TelegramPhotoMessage,
): Promise<"processed" | "duplicate"> {
  return processTelegramBoxList({
    chatId: message.chatId,
    replyToMessageId: message.messageId,
    updateId: message.updateId,
    userName: message.userName,
    caption: message.caption,
    fileIds: [message.fileId],
    mimeType: message.mimeType,
  });
}

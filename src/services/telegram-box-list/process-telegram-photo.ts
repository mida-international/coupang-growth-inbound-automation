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
import {
  getTelegramBoxListStoragePath,
  uploadExcelFile,
} from "@/lib/supabase/storage";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function processTelegramPhotoMessage(
  message: TelegramPhotoMessage,
): Promise<"processed" | "duplicate"> {
  const uploadId = crypto.randomUUID();
  const outputFileName = buildBoxListExcelFilename("telegram-box-list");

  try {
    await prisma.telegramBoxListUpload.create({
      data: {
        id: uploadId,
        outputFileName,
        telegramChatId: message.chatId,
        telegramMessageId: BigInt(message.messageId),
        telegramUpdateId: BigInt(message.updateId),
        telegramUserName: message.userName,
        telegramCaption: message.caption,
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
    chatId: message.chatId,
    text: "🔄 이미지를 받았어요. OCR 변환 작업 중입니다… 잠시만 기다려 주세요.",
    replyToMessageId: message.messageId,
  }).catch(() => undefined);

  try {
    const file = await getTelegramFile(message.fileId);

    if (!file.file_path) {
      throw new Error("Telegram 파일 경로를 가져오지 못했습니다.");
    }

    const imageBuffer = await downloadTelegramFile(file.file_path);
    const result = await extractBoxListFromImages([
      { buffer: imageBuffer, mimeType: message.mimeType },
    ]);
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
      chatId: message.chatId,
      text: `✅ OCR 완료 · ${rowCount}행 · 자동화 > 텔레그램에서 다운로드`,
      replyToMessageId: message.messageId,
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
      chatId: message.chatId,
      text: `❌ OCR 실패: ${errorMessage.slice(0, 200)}`,
      replyToMessageId: message.messageId,
    }).catch(() => undefined);

    throw error;
  }
}

import "server-only";

import { prisma } from "@/lib/db";
import { buildTelegramCaptionHint } from "@/lib/telegram/caption";
import { sendTelegramMessage } from "@/lib/telegram/client";
import type { TelegramPhotoCandidate } from "@/lib/telegram/parse-update";
import { processTelegramBoxList } from "@/services/telegram-box-list/process-telegram-photo";

// 앨범 사진들은 각각 별개 업데이트로 "거의 동시에" 도착한다. "앨범 끝" 신호가
// 없으므로, 마지막 사진 도착 후 이 시간이 지나면 완결된 것으로 보고 처리한다.
const ALBUM_DEBOUNCE_MS = 3000;
// lastPhotoAt 비교 시 시계 오차 흡수용 여유.
const SETTLE_MARGIN_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 텔레그램 앨범(미디어 그룹)의 사진 한 장을 버퍼에 모은다. 각 사진의 웹훅 호출이
 * 이 함수를 실행하며, debounce 창이 지난 뒤 "단 하나의" 호출만 원자적으로
 * 처리를 선점(collecting → processing)하여 모인 사진 전체를 하나의 산출물로 만든다.
 */
export async function accumulateTelegramAlbumPhoto(
  candidate: TelegramPhotoCandidate,
  mediaGroupId: string,
): Promise<void> {
  const now = new Date();

  const group = await prisma.telegramMediaGroup.upsert({
    where: {
      chatId_mediaGroupId: {
        chatId: candidate.chatId,
        mediaGroupId,
      },
    },
    create: {
      chatId: candidate.chatId,
      mediaGroupId,
      fileIds: [candidate.fileId],
      mimeType: candidate.mimeType,
      caption: candidate.caption,
      userName: candidate.userName,
      firstMessageId: BigInt(candidate.messageId),
      firstUpdateId: BigInt(candidate.updateId),
      status: "collecting",
      lastPhotoAt: now,
    },
    update: {
      fileIds: { push: candidate.fileId },
      lastPhotoAt: now,
      // 앨범은 보통 첫 장에만 캡션이 달리므로, 캡션이 실린 사진이 오면 채워둔다.
      ...(candidate.caption ? { caption: candidate.caption } : {}),
    },
  });

  await sleep(ALBUM_DEBOUNCE_MS);

  // 마지막 사진이 debounce 창을 넘겼고 아직 아무도 선점하지 않은 경우에만,
  // 원자적 상태 전이로 정확히 하나의 호출만 처리 권한을 가져간다.
  const settledBefore = new Date(Date.now() - ALBUM_DEBOUNCE_MS + SETTLE_MARGIN_MS);
  const claim = await prisma.telegramMediaGroup.updateMany({
    where: {
      id: group.id,
      status: "collecting",
      lastPhotoAt: { lte: settledBefore },
    },
    data: { status: "processing" },
  });

  if (claim.count !== 1) {
    // 더 늦게 도착한 사진의 호출이 처리하거나, 이미 다른 호출이 선점함.
    return;
  }

  const full = await prisma.telegramMediaGroup.findUnique({
    where: { id: group.id },
  });

  if (!full) {
    return;
  }

  const fileIds = [...new Set(full.fileIds)];
  const caption = full.caption?.trim() ?? "";

  // 앨범 전체에 캡션이 하나도 없으면 안내만 하고 처리하지 않는다.
  if (!caption) {
    await sendTelegramMessage({
      chatId: full.chatId,
      text: buildTelegramCaptionHint(),
      replyToMessageId: Number(full.firstMessageId),
    }).catch(() => undefined);

    await prisma.telegramMediaGroup
      .update({ where: { id: full.id }, data: { status: "skipped" } })
      .catch(() => undefined);

    return;
  }

  try {
    await processTelegramBoxList({
      chatId: full.chatId,
      replyToMessageId: Number(full.firstMessageId),
      updateId: full.firstUpdateId,
      userName: full.userName,
      caption,
      fileIds,
      mimeType: full.mimeType,
    });

    await prisma.telegramMediaGroup
      .update({ where: { id: full.id }, data: { status: "completed" } })
      .catch(() => undefined);
  } catch (error) {
    await prisma.telegramMediaGroup
      .update({ where: { id: full.id }, data: { status: "failed" } })
      .catch(() => undefined);

    throw error;
  }
}

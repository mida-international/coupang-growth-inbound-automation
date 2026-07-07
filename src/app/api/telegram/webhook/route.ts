import { after } from "next/server";

import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import { buildTelegramCaptionHint, matchesTelegramCaption } from "@/lib/telegram/caption";
import { sendTelegramMessage } from "@/lib/telegram/client";
import {
  getTelegramAllowedChatIds,
  getTelegramWebhookSecret,
  isTelegramEnabled,
} from "@/lib/telegram/config";
import { isAllowedTelegramChat } from "@/lib/telegram/is-allowed-chat";
import {
  parseTelegramPhotoCandidate,
  parseTelegramPhotoMessage,
  type TelegramUpdate,
} from "@/lib/telegram/parse-update";
import { accumulateTelegramAlbumPhoto } from "@/services/telegram-box-list/accumulate-album";
import { processTelegramPhotoMessage } from "@/services/telegram-box-list/process-telegram-photo";

export const runtime = "nodejs";
export const maxDuration = 120;

function verifyWebhookSecret(request: Request): boolean {
  const configuredSecret = getTelegramWebhookSecret();

  if (!configuredSecret) {
    return true;
  }

  const headerSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");

  return headerSecret === configuredSecret;
}

export async function POST(request: Request) {
  if (!isTelegramEnabled()) {
    return jsonError("Telegram integration is disabled.", 503);
  }

  if (!verifyWebhookSecret(request)) {
    return jsonError("Invalid webhook secret.", 401);
  }

  let update: TelegramUpdate;

  try {
    update = (await request.json()) as TelegramUpdate;
  } catch (error) {
    logRouteError(error, {
      route: "/api/telegram/webhook",
      method: "POST",
    });
    return jsonError("Invalid JSON body.", 400);
  }

  const candidate = parseTelegramPhotoCandidate(update);

  if (!candidate) {
    return new Response("ok", { status: 200 });
  }

  const allowedChatIds = getTelegramAllowedChatIds();

  if (!isAllowedTelegramChat(candidate.chatId, allowedChatIds)) {
    return new Response("ok", { status: 200 });
  }

  // 앨범(미디어 그룹): 여러 장을 모아 하나의 산출물로 처리한다.
  // 캡션은 앨범 전체에서 하나라도 있으면 되므로 여기서 캡션 검사를 하지 않는다.
  //
  // 중요: 응답을 붙잡고 debounce/OCR을 하면 텔레그램이 "Read timeout"으로 다음
  // 앨범 사진 전송을 지연/재시도해, 사진들이 debounce 창 밖으로 흩어져 일부만
  // 수집된다. 그래서 즉시 200을 돌려주고 실제 작업은 after()(백그라운드)로 넘긴다.
  if (candidate.mediaGroupId) {
    const mediaGroupId = candidate.mediaGroupId;

    after(async () => {
      try {
        await accumulateTelegramAlbumPhoto(candidate, mediaGroupId);
      } catch (error) {
        logRouteError(error, {
          route: "/api/telegram/webhook",
          method: "POST",
        });
      }
    });

    return new Response("ok", { status: 200 });
  }

  if (!matchesTelegramCaption(candidate.caption)) {
    if (!candidate.caption?.trim()) {
      after(() =>
        sendTelegramMessage({
          chatId: candidate.chatId,
          text: buildTelegramCaptionHint(),
          replyToMessageId: candidate.messageId,
        }).catch(() => undefined),
      );
    }

    return new Response("ok", { status: 200 });
  }

  const photoMessage = parseTelegramPhotoMessage(update);

  if (!photoMessage) {
    return new Response("ok", { status: 200 });
  }

  // 단일 사진도 동일하게 즉시 200 후 백그라운드 처리 (OCR로 응답을 붙잡지 않음).
  after(async () => {
    try {
      await processTelegramPhotoMessage(photoMessage);
    } catch (error) {
      logRouteError(error, {
        route: "/api/telegram/webhook",
        method: "POST",
      });
    }
  });

  return new Response("ok", { status: 200 });
}

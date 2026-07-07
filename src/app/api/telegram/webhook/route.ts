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
  if (candidate.mediaGroupId) {
    try {
      await accumulateTelegramAlbumPhoto(candidate, candidate.mediaGroupId);
    } catch (error) {
      logRouteError(error, {
        route: "/api/telegram/webhook",
        method: "POST",
      });
    }

    return new Response("ok", { status: 200 });
  }

  if (!matchesTelegramCaption(candidate.caption)) {
    if (!candidate.caption?.trim()) {
      await sendTelegramMessage({
        chatId: candidate.chatId,
        text: buildTelegramCaptionHint(),
        replyToMessageId: candidate.messageId,
      }).catch(() => undefined);
    }

    return new Response("ok", { status: 200 });
  }

  const photoMessage = parseTelegramPhotoMessage(update);

  if (!photoMessage) {
    return new Response("ok", { status: 200 });
  }

  try {
    await processTelegramPhotoMessage(photoMessage);
  } catch (error) {
    logRouteError(error, {
      route: "/api/telegram/webhook",
      method: "POST",
    });
  }

  return new Response("ok", { status: 200 });
}

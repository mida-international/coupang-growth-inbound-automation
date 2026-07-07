import { matchesTelegramCaption } from "@/lib/telegram/caption";

export type TelegramPhotoMessage = {
  updateId: number;
  chatId: string;
  messageId: number;
  fileId: string;
  mimeType: string;
  userName: string | null;
  caption: string;
};

export type TelegramPhotoCandidate = {
  updateId: number;
  chatId: string;
  messageId: number;
  fileId: string;
  mimeType: string;
  userName: string | null;
  caption: string | null;
  mediaGroupId: string | null;
};

type TelegramPhotoSize = {
  file_id: string;
  width: number;
  height: number;
};

type TelegramMessage = {
  message_id: number;
  media_group_id?: string;
  caption?: string;
  from?: {
    username?: string;
    first_name?: string;
  };
  chat: {
    id: number | string;
  };
  photo?: TelegramPhotoSize[];
  document?: {
    file_id: string;
    mime_type?: string;
    file_name?: string;
  };
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

function pickLargestPhoto(photos: TelegramPhotoSize[]): TelegramPhotoSize {
  return photos.reduce((largest, current) =>
    current.width * current.height > largest.width * largest.height
      ? current
      : largest,
  );
}

function isImageDocument(message: TelegramMessage): boolean {
  const mimeType = message.document?.mime_type?.toLowerCase() ?? "";

  if (mimeType.startsWith("image/")) {
    return true;
  }

  const fileName = message.document?.file_name?.toLowerCase() ?? "";

  return /\.(jpe?g|png|webp|gif|bmp|heic)$/i.test(fileName);
}

export function parseTelegramPhotoCandidate(
  update: TelegramUpdate,
): TelegramPhotoCandidate | null {
  const message = update.message;

  if (!message) {
    return null;
  }

  const base = {
    updateId: update.update_id,
    chatId: String(message.chat.id),
    messageId: message.message_id,
    userName: message.from?.username ?? message.from?.first_name ?? null,
    caption: message.caption?.trim() || null,
    mediaGroupId: message.media_group_id ?? null,
  };

  if (message.photo?.length) {
    const photo = pickLargestPhoto(message.photo);

    return {
      ...base,
      fileId: photo.file_id,
      mimeType: "image/jpeg",
    };
  }

  if (message.document && isImageDocument(message)) {
    return {
      ...base,
      fileId: message.document.file_id,
      mimeType: message.document.mime_type ?? "image/jpeg",
    };
  }

  return null;
}

export function parseTelegramPhotoMessage(
  update: TelegramUpdate,
): TelegramPhotoMessage | null {
  const candidate = parseTelegramPhotoCandidate(update);

  if (!candidate || !matchesTelegramCaption(candidate.caption)) {
    return null;
  }

  return {
    ...candidate,
    caption: candidate.caption!.trim(),
  };
}

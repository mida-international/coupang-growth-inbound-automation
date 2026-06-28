import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildTelegramCaptionHint,
  matchesTelegramCaption,
} from "@/lib/telegram/caption";
import { isAllowedTelegramChat } from "@/lib/telegram/is-allowed-chat";
import {
  parseTelegramPhotoCandidate,
  parseTelegramPhotoMessage,
  type TelegramUpdate,
} from "@/lib/telegram/parse-update";

describe("matchesTelegramCaption", () => {
  it("accepts any non-empty caption regardless of keyword", () => {
    assert.equal(matchesTelegramCaption(null), false);
    assert.equal(matchesTelegramCaption(""), false);
    assert.equal(matchesTelegramCaption("   "), false);
    assert.equal(matchesTelegramCaption("그냥 사진"), true);
    assert.equal(matchesTelegramCaption("#박스 1번"), true);
    assert.equal(matchesTelegramCaption("  박스  "), true);
  });

  it("provides a caption hint", () => {
    assert.ok(buildTelegramCaptionHint().includes("캡션"));
  });
});

describe("isAllowedTelegramChat", () => {
  it("returns false when allowlist is empty", () => {
    assert.equal(isAllowedTelegramChat("-1003730657434", new Set()), false);
  });

  it("matches numeric chat ids as strings", () => {
    const allowed = new Set(["-1003730657434"]);
    assert.equal(isAllowedTelegramChat(-1003730657434, allowed), true);
    assert.equal(isAllowedTelegramChat("999", allowed), false);
  });
});

describe("parseTelegramPhotoMessage", () => {
  it("returns null for non-photo updates", () => {
    const update: TelegramUpdate = {
      update_id: 1,
      message: {
        message_id: 10,
        chat: { id: -1003730657434 },
        photo: undefined,
      },
    };

    assert.equal(parseTelegramPhotoMessage(update), null);
  });

  it("returns null when photo has no matching caption", () => {
    const update: TelegramUpdate = {
      update_id: 42,
      message: {
        message_id: 99,
        chat: { id: -1003730657434 },
        photo: [{ file_id: "large", width: 1280, height: 960 }],
      },
    };

    assert.equal(parseTelegramPhotoMessage(update), null);
    assert.ok(parseTelegramPhotoCandidate(update));
  });

  it("picks the largest photo size when caption matches", () => {
    const previous = process.env.TELEGRAM_CAPTION_KEYWORD;
    process.env.TELEGRAM_CAPTION_KEYWORD = "#박스";

    try {
      const update: TelegramUpdate = {
        update_id: 42,
        message: {
          message_id: 99,
          caption: "#박스 2번",
          from: { username: "heerah" },
          chat: { id: -1003730657434 },
          photo: [
            { file_id: "small", width: 90, height: 90 },
            { file_id: "large", width: 1280, height: 960 },
            { file_id: "medium", width: 320, height: 240 },
          ],
        },
      };

      const parsed = parseTelegramPhotoMessage(update);

      assert.ok(parsed);
      assert.equal(parsed.updateId, 42);
      assert.equal(parsed.chatId, "-1003730657434");
      assert.equal(parsed.messageId, 99);
      assert.equal(parsed.fileId, "large");
      assert.equal(parsed.userName, "heerah");
      assert.equal(parsed.caption, "#박스 2번");
    } finally {
      if (previous === undefined) {
        delete process.env.TELEGRAM_CAPTION_KEYWORD;
      } else {
        process.env.TELEGRAM_CAPTION_KEYWORD = previous;
      }
    }
  });

  it("accepts image documents with caption", () => {
    const previous = process.env.TELEGRAM_CAPTION_KEYWORD;
    process.env.TELEGRAM_CAPTION_KEYWORD = "#박스";

    try {
      const update: TelegramUpdate = {
        update_id: 7,
        message: {
          message_id: 12,
          caption: "#박스",
          chat: { id: -1003730657434 },
          document: {
            file_id: "doc-image",
            mime_type: "image/png",
            file_name: "box-list.png",
          },
        },
      };

      const parsed = parseTelegramPhotoMessage(update);

      assert.ok(parsed);
      assert.equal(parsed.fileId, "doc-image");
      assert.equal(parsed.mimeType, "image/png");
    } finally {
      if (previous === undefined) {
        delete process.env.TELEGRAM_CAPTION_KEYWORD;
      } else {
        process.env.TELEGRAM_CAPTION_KEYWORD = previous;
      }
    }
  });
});

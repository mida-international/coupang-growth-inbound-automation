-- CreateTable
CREATE TABLE "telegram_media_group" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "media_group_id" TEXT NOT NULL,
    "file_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mime_type" TEXT NOT NULL DEFAULT 'image/jpeg',
    "caption" TEXT,
    "user_name" TEXT,
    "first_message_id" BIGINT NOT NULL,
    "first_update_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'collecting',
    "last_photo_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_media_group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_telegram_media_group_chat_group" ON "telegram_media_group"("chat_id", "media_group_id");

-- CreateIndex
CREATE INDEX "idx_telegram_media_group_status_at" ON "telegram_media_group"("status", "last_photo_at");

-- CreateTable
CREATE TABLE "shopling_wms_session" (
    "user_id" TEXT NOT NULL,
    "storage_state" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopling_wms_session_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "shopling_wms_session" ADD CONSTRAINT "shopling_wms_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

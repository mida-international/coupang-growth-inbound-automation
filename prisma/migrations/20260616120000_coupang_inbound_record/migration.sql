-- CreateTable
CREATE TABLE "coupang_inbound_record" (
    "id" TEXT NOT NULL,
    "coupang_seller_account_id" TEXT NOT NULL,
    "product_barcode" TEXT NOT NULL,
    "coupang_option_id" BIGINT,
    "quantity" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_id" TEXT NOT NULL,
    "batch_id" TEXT,

    CONSTRAINT "coupang_inbound_record_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "coupang_inbound_record" ADD CONSTRAINT "coupang_inbound_record_coupang_seller_account_id_fkey" FOREIGN KEY ("coupang_seller_account_id") REFERENCES "CoupangSellerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupang_inbound_record" ADD CONSTRAINT "coupang_inbound_record_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "idx_inbound_record_seller_barcode_at" ON "coupang_inbound_record"("coupang_seller_account_id", "product_barcode", "recorded_at");

-- CreateIndex
CREATE INDEX "idx_inbound_record_batch_id" ON "coupang_inbound_record"("batch_id");

-- CreateTable
CREATE TABLE "warehouse_inbound_deliverable" (
    "id" TEXT NOT NULL,
    "coupang_seller_account_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "output_file_name" TEXT NOT NULL,
    "record_date" DATE NOT NULL,
    "rotation_count" INTEGER NOT NULL DEFAULT 0,
    "recorded_by_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_inbound_deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_inbound_deliverable_item" (
    "id" TEXT NOT NULL,
    "deliverable_id" TEXT NOT NULL,
    "record_date" DATE NOT NULL,
    "location" TEXT,
    "registered_product_name" TEXT,
    "option_name" TEXT,
    "product_barcode" TEXT,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "warehouse_inbound_deliverable_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_warehouse_inbound_deliverable_seller_date" ON "warehouse_inbound_deliverable"("coupang_seller_account_id", "record_date");

-- CreateIndex
CREATE INDEX "idx_warehouse_inbound_deliverable_by_at" ON "warehouse_inbound_deliverable"("recorded_by_id", "recorded_at");

-- CreateIndex
CREATE INDEX "idx_warehouse_inbound_deliverable_item_deliverable" ON "warehouse_inbound_deliverable_item"("deliverable_id");

-- CreateIndex
CREATE INDEX "idx_warehouse_inbound_deliverable_item_barcode_date" ON "warehouse_inbound_deliverable_item"("product_barcode", "record_date");

-- AddForeignKey
ALTER TABLE "warehouse_inbound_deliverable" ADD CONSTRAINT "warehouse_inbound_deliverable_coupang_seller_account_id_fkey" FOREIGN KEY ("coupang_seller_account_id") REFERENCES "CoupangSellerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_inbound_deliverable" ADD CONSTRAINT "warehouse_inbound_deliverable_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_inbound_deliverable_item" ADD CONSTRAINT "warehouse_inbound_deliverable_item_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "warehouse_inbound_deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

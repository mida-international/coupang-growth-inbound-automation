-- CreateTable
CREATE TABLE "shopling_inbound_deliverable" (
    "id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "output_file_name" TEXT NOT NULL,
    "source_file_name" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopling_inbound_deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopling_inbound_deliverable_item" (
    "id" TEXT NOT NULL,
    "deliverable_id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopling_inbound_deliverable_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_shopling_inbound_deliverable_by_at" ON "shopling_inbound_deliverable"("recorded_by_id", "recorded_at");

-- CreateIndex
CREATE INDEX "idx_shopling_inbound_deliverable_item_deliverable" ON "shopling_inbound_deliverable_item"("deliverable_id");

-- CreateIndex
CREATE INDEX "idx_shopling_inbound_deliverable_item_barcode_at" ON "shopling_inbound_deliverable_item"("barcode", "recorded_at");

-- AddForeignKey
ALTER TABLE "shopling_inbound_deliverable" ADD CONSTRAINT "shopling_inbound_deliverable_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopling_inbound_deliverable_item" ADD CONSTRAINT "shopling_inbound_deliverable_item_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "shopling_inbound_deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

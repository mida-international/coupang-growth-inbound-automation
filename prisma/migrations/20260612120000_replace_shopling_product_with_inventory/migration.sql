-- DropForeignKey
ALTER TABLE "shopling_product" DROP CONSTRAINT "shopling_product_ingestion_id_fkey";

-- DropTable
DROP TABLE "shopling_product";

-- CreateTable
CREATE TABLE "shopling_inventory" (
    "id" BIGSERIAL NOT NULL,
    "ingestion_id" BIGINT,
    "goods_key" TEXT NOT NULL,
    "ptn_goods_cd" TEXT,
    "product_name" VARCHAR(500),
    "sale_status" TEXT,
    "goods_tp" VARCHAR(2) DEFAULT 'G',
    "barcode" VARCHAR(20) NOT NULL DEFAULT '',
    "opt_id" VARCHAR(32),
    "option_title" VARCHAR(500),
    "option_value" VARCHAR(500),
    "available_stock" INTEGER DEFAULT 0,
    "real_stock" INTEGER DEFAULT 0,
    "opt_vrtl_qty" INTEGER DEFAULT 0,
    "opt_price" INTEGER DEFAULT 0,
    "opt_supply_price" INTEGER DEFAULT 0,
    "opt_status" TEXT,
    "location" VARCHAR(20),
    "snapshot_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopling_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_shopling_inv_barcode" ON "shopling_inventory"("barcode");

-- CreateIndex
CREATE INDEX "idx_shopling_inv_snapshot_date" ON "shopling_inventory"("snapshot_date");

-- CreateIndex
CREATE INDEX "idx_shopling_inv_ptn_goods_cd" ON "shopling_inventory"("ptn_goods_cd");

-- CreateIndex
CREATE INDEX "idx_shopling_inv_goods_key" ON "shopling_inventory"("goods_key");

-- CreateIndex
CREATE INDEX "idx_shopling_inv_ingestion_id" ON "shopling_inventory"("ingestion_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_shopling_inv_barcode_date_goods_opt" ON "shopling_inventory"("barcode", "snapshot_date", "goods_key", "option_title", "option_value");

-- AddForeignKey
ALTER TABLE "shopling_inventory" ADD CONSTRAINT "shopling_inventory_ingestion_id_fkey" FOREIGN KEY ("ingestion_id") REFERENCES "ingestion_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Partial indexes (Prisma schema unsupported)
CREATE INDEX "idx_shopling_inv_opt_id" ON "shopling_inventory" ("opt_id")
  WHERE "opt_id" IS NOT NULL AND "opt_id" <> '';

CREATE INDEX "idx_shopling_inv_goods_tp" ON "shopling_inventory" ("goods_tp")
  WHERE "goods_tp" IS NOT NULL AND "goods_tp" <> 'G';

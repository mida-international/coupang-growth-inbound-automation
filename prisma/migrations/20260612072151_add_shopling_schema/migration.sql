-- CreateTable
CREATE TABLE "shopling_api_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "login_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "api_auth_key" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "shopling_api_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopling_product" (
    "id" BIGSERIAL NOT NULL,
    "ingestion_id" BIGINT,
    "goods_key" TEXT NOT NULL,
    "ptn_goods_cd" TEXT,
    "product_name" VARCHAR(500),
    "sale_status" TEXT,
    "goods_tp" VARCHAR(2) DEFAULT 'G',
    "barcode" VARCHAR(20) NOT NULL DEFAULT '',
    "opt_id" VARCHAR(32),
    "option_name" VARCHAR(500),
    "available_stock" INTEGER DEFAULT 0,
    "real_stock" INTEGER DEFAULT 0,
    "opt_vrtl_qty" INTEGER DEFAULT 0,
    "opt_price" INTEGER DEFAULT 0,
    "opt_supply_price" INTEGER DEFAULT 0,
    "opt_status" TEXT,
    "location" VARCHAR(20),
    "snapshot_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopling_product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_shopling_product_barcode" ON "shopling_product"("barcode");

-- CreateIndex
CREATE INDEX "idx_shopling_product_snapshot_date" ON "shopling_product"("snapshot_date");

-- CreateIndex
CREATE INDEX "idx_shopling_product_ptn_goods_cd" ON "shopling_product"("ptn_goods_cd");

-- CreateIndex
CREATE INDEX "idx_shopling_product_goods_key" ON "shopling_product"("goods_key");

-- CreateIndex
CREATE INDEX "idx_shopling_product_ingestion_id" ON "shopling_product"("ingestion_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_shopling_product_barcode_date_goods_opt" ON "shopling_product"("barcode", "snapshot_date", "goods_key", "option_name");

-- AddForeignKey
ALTER TABLE "shopling_api_config" ADD CONSTRAINT "shopling_api_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopling_product" ADD CONSTRAINT "shopling_product_ingestion_id_fkey" FOREIGN KEY ("ingestion_id") REFERENCES "ingestion_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

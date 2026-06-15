-- CreateTable
CREATE TABLE "shopling_package_mapping" (
    "id" TEXT NOT NULL,
    "package_barcode" TEXT,
    "package_goods_key" TEXT NOT NULL,
    "package_opt_id" TEXT NOT NULL,
    "package_ptn_goods_cd" TEXT,
    "package_opt_value" TEXT,
    "single_barcode" TEXT,
    "single_goods_key" TEXT,
    "single_opt_id" TEXT NOT NULL,
    "single_opt_value" TEXT,
    "single_ptn_goods_cd" TEXT,
    "map_cnt" INTEGER NOT NULL DEFAULT 1,
    "manually_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopling_package_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_spm_package_opt_id" ON "shopling_package_mapping"("package_opt_id");

-- CreateIndex
CREATE INDEX "idx_spm_single_opt_id" ON "shopling_package_mapping"("single_opt_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_package_single_opt" ON "shopling_package_mapping"("package_opt_id", "single_opt_id");

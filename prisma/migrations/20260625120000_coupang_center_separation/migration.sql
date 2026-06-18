-- CreateTable
CREATE TABLE "coupang_center_separation" (
    "id" TEXT NOT NULL,
    "registered_product_name" TEXT,
    "option_name" TEXT,
    "ptn_goods_cd" TEXT,
    "shopling_option_value" TEXT,
    "barcode" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupang_center_separation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupang_center_separation_barcode_key" ON "coupang_center_separation"("barcode");

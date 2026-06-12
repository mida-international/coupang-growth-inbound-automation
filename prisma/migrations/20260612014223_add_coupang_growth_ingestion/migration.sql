-- CreateTable
CREATE TABLE "ingestion_log" (
    "id" BIGSERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "snapshot_date" DATE,
    "operation" TEXT NOT NULL,
    "row_count" INTEGER,
    "uploaded_by" TEXT,
    "source_file" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupang_growth_inbound_template" (
    "id" BIGSERIAL NOT NULL,
    "ingestion_id" BIGINT,
    "coupang_seller_account_id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "registered_product_name" TEXT,
    "option_name" TEXT,
    "selling_price" INTEGER,
    "exposed_product_id" BIGINT,
    "registered_product_id" BIGINT,
    "option_id" BIGINT,
    "selling_method" TEXT,
    "sales_2025_total" BIGINT,
    "sales_2026_total" BIGINT,
    "sales_2026_03" BIGINT,
    "sales_2026_04" BIGINT,
    "sales_2026_05" BIGINT,
    "sales_last_14days" BIGINT,
    "qty_sold_2weeks" INTEGER,
    "qty_sold_1week" INTEGER,
    "seller_fee_rate" DECIMAL(6,3),
    "seller_fee" INTEGER,
    "cfs_estimated_fee" INTEGER,
    "base_discount" INTEGER,
    "discounted_estimated_fee" INTEGER,
    "est_sales_2weeks_by_qty" BIGINT,
    "shelf_life_days_input" TEXT,
    "expiry_date" TEXT,
    "manufacture_date" TEXT,
    "production_year" TEXT,
    "product_barcode" TEXT,
    "product_size" TEXT,
    "handle_with_care" TEXT,
    "available_stock" INTEGER,
    "est_stockout_date" TEXT,
    "category" TEXT,
    "parallel_import" TEXT,
    "tax_type" TEXT,
    "sku_id" BIGINT,
    "req_exp_date" BOOLEAN,
    "req_man_date" BOOLEAN,
    "req_prod_year" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupang_growth_inbound_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupang_growth_inventory_health" (
    "id" BIGSERIAL NOT NULL,
    "ingestion_id" BIGINT,
    "coupang_seller_account_id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "inventory_id" BIGINT,
    "option_id" BIGINT,
    "sku_id" BIGINT,
    "product_name" TEXT,
    "option_name" TEXT,
    "offer_condition" TEXT,
    "orderable_quantity" INTEGER,
    "pending_inbounds" INTEGER,
    "item_winner" TEXT,
    "recent_sales_7days" BIGINT,
    "recent_sales_30days" BIGINT,
    "recent_sales_qty_7days" INTEGER,
    "recent_sales_qty_30days" INTEGER,
    "recommended_inbound_qty" INTEGER,
    "recommended_inbound_date" TEXT,
    "days_of_cover" TEXT,
    "monthly_storage_fee" INTEGER,
    "sku_age_1_30" INTEGER,
    "sku_age_31_45" INTEGER,
    "sku_age_46_60" INTEGER,
    "sku_age_61_120" INTEGER,
    "sku_age_121_180" INTEGER,
    "sku_age_181_plus" INTEGER,
    "customer_returns_30days" INTEGER,
    "season" TEXT,
    "product_listing_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupang_growth_inventory_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ingestion_log_table_date" ON "ingestion_log"("table_name", "snapshot_date");

-- CreateIndex
CREATE INDEX "idx_inbound_template_option_id" ON "coupang_growth_inbound_template"("option_id");

-- CreateIndex
CREATE INDEX "idx_inbound_template_snapshot_date" ON "coupang_growth_inbound_template"("snapshot_date");

-- CreateIndex
CREATE INDEX "idx_inbound_template_ingestion_id" ON "coupang_growth_inbound_template"("ingestion_id");

-- CreateIndex
CREATE INDEX "idx_inbound_template_seller_snapshot" ON "coupang_growth_inbound_template"("coupang_seller_account_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "idx_inbound_template_seller_option" ON "coupang_growth_inbound_template"("coupang_seller_account_id", "option_id");

-- CreateIndex
CREATE INDEX "idx_inventory_health_option_id" ON "coupang_growth_inventory_health"("option_id");

-- CreateIndex
CREATE INDEX "idx_inventory_health_snapshot_date" ON "coupang_growth_inventory_health"("snapshot_date");

-- CreateIndex
CREATE INDEX "idx_inventory_health_ingestion_id" ON "coupang_growth_inventory_health"("ingestion_id");

-- CreateIndex
CREATE INDEX "idx_inventory_health_seller_snapshot" ON "coupang_growth_inventory_health"("coupang_seller_account_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "idx_inventory_health_seller_option" ON "coupang_growth_inventory_health"("coupang_seller_account_id", "option_id");

-- AddForeignKey
ALTER TABLE "ingestion_log" ADD CONSTRAINT "ingestion_log_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupang_growth_inbound_template" ADD CONSTRAINT "coupang_growth_inbound_template_ingestion_id_fkey" FOREIGN KEY ("ingestion_id") REFERENCES "ingestion_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupang_growth_inbound_template" ADD CONSTRAINT "coupang_growth_inbound_template_coupang_seller_account_id_fkey" FOREIGN KEY ("coupang_seller_account_id") REFERENCES "CoupangSellerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupang_growth_inventory_health" ADD CONSTRAINT "coupang_growth_inventory_health_ingestion_id_fkey" FOREIGN KEY ("ingestion_id") REFERENCES "ingestion_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupang_growth_inventory_health" ADD CONSTRAINT "coupang_growth_inventory_health_coupang_seller_account_id_fkey" FOREIGN KEY ("coupang_seller_account_id") REFERENCES "CoupangSellerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

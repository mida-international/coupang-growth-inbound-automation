-- Partial indexes for barcode lookup (not expressible in Prisma schema)
CREATE INDEX "idx_spm_package_barcode" ON "shopling_package_mapping"("package_barcode")
  WHERE "package_barcode" IS NOT NULL;

CREATE INDEX "idx_spm_single_barcode" ON "shopling_package_mapping"("single_barcode")
  WHERE "single_barcode" IS NOT NULL;

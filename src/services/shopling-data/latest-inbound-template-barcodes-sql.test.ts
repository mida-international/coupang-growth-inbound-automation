import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Prisma } from "@/generated/prisma/client";
import { buildLatestInboundTemplateBarcodesCte } from "@/services/shopling-data/latest-inbound-template-barcodes-sql";
import { buildNewOptionProductsBaseCte } from "@/services/shopling-data/list-new-option-products-query";

function prismaSqlText(sql: Prisma.Sql): string {
  return sql.strings.join("");
}

describe("buildLatestInboundTemplateBarcodesCte", () => {
  it("includes latest template snapshot and barcode CTEs", () => {
    const text = prismaSqlText(buildLatestInboundTemplateBarcodesCte());

    assert.match(text, /coupang_growth_inbound_template/);
    assert.match(text, /template_snapshot AS/);
    assert.match(text, /template_latest AS/);
    assert.match(text, /inbound_template_barcodes AS/);
    assert.match(text, /TRIM\(t\.product_barcode\)/);
  });
});

describe("listNewOptionProducts inbound template exclusion", () => {
  it("uses visible_rows with NOT EXISTS against inbound_template_barcodes", () => {
    const text = prismaSqlText(
      buildNewOptionProductsBaseCte("2026-01-01", "2026-01-31", Prisma.empty),
    );

    assert.match(text, /visible_rows AS/);
    assert.match(text, /NOT EXISTS/);
    assert.match(text, /inbound_template_barcodes itb/);
    assert.match(text, /TRIM\(dr\.barcode\) = itb\.barcode/);
  });
});

import fs from "fs/promises";

import { decomposeOutboundDeductRows } from "@/lib/deliverables/decompose-outbound-deduct-rows";
import { normalizeOutboundBoxListFromBuffer } from "@/lib/deliverables/normalize-outbound-box-items";
import { fillShoplingOutboundTemplate } from "@/lib/excel/generators/fill-shopling-outbound-template";
import { getShoplingOutboundTemplatePath } from "@/lib/excel/targets/shopling-gross-outbound-template";
import { loadOutboundDecomposeContext } from "@/services/deliverables/load-outbound-decompose-context";
import type { GenerateShoplingOutboundTemplateResult } from "@/services/deliverables/types";

export async function generateShoplingOutboundTemplate(input: {
  boxListBuffer: Buffer;
}): Promise<GenerateShoplingOutboundTemplateResult> {
  const normalized = normalizeOutboundBoxListFromBuffer(input.boxListBuffer);

  if (normalized.inputWithQty === 0 || normalized.qtyByBarcode.size === 0) {
    throw new Error(
      "출고 리스트에서 유효한 바코드·수량(0보다 큰 값)이 없습니다.",
    );
  }

  const context = await loadOutboundDecomposeContext();
  const decomposed = decomposeOutboundDeductRows(
    normalized.qtyByBarcode,
    context,
  );

  if (decomposed.rows.length === 0) {
    const skippedPreview = decomposed.stats.skippedUnmappedPackages
      .slice(0, 5)
      .join(", ");
    const skippedSuffix =
      skippedPreview.length > 0 ? ` (미매핑 패키지: ${skippedPreview})` : "";

    throw new Error(
      `출고 템플릿에 넣을 바코드가 없습니다. 패키지 미매핑·재고 미등록 등으로 전부 스킵되었습니다.${skippedSuffix}`,
    );
  }

  let templateBuffer: Buffer;

  try {
    templateBuffer = await fs.readFile(getShoplingOutboundTemplatePath());
  } catch {
    throw new Error("출고 템플릿 파일이 서버에 없습니다.");
  }

  const buffer = await fillShoplingOutboundTemplate(
    templateBuffer,
    decomposed.rows,
  );

  return {
    buffer,
    rows: decomposed.rows,
    stats: {
      inputBarcodes: decomposed.stats.inputBarcodes,
      outputRows: decomposed.stats.outputRows,
      packagesDecomposed: decomposed.stats.packagesDecomposed,
      skippedUnmappedPackages: decomposed.stats.skippedUnmappedPackages,
      skippedDummy: normalized.skippedDummy,
    },
  };
}

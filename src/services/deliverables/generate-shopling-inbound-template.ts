import fs from "fs/promises";

import { fillShoplingOutboundTemplate } from "@/lib/excel/generators/fill-shopling-outbound-template";
import { parseShoplingInboundList } from "@/lib/excel/parsers/parse-shopling-inbound-list";
import { getShoplingOutboundTemplatePath } from "@/lib/excel/targets/shopling-gross-outbound-template";
import { validateShoplingInboundListFile } from "@/lib/excel/validators/validate-shopling-inbound-list-file";
import {
  formatShoplingInboundLookupError,
  lookupShoplingInboundBarcodes,
} from "@/services/deliverables/lookup-shopling-inbound-barcodes";
import type { GenerateShoplingInboundTemplateResult } from "@/services/deliverables/types";

export async function generateShoplingInboundTemplate(input: {
  inboundListBuffer: Buffer;
}): Promise<GenerateShoplingInboundTemplateResult> {
  const validationError = validateShoplingInboundListFile(input.inboundListBuffer);

  if (validationError) {
    throw new Error(`[입고 리스트 오류] ${validationError}`);
  }

  const parsed = parseShoplingInboundList(input.inboundListBuffer);

  if (parsed.items.length === 0) {
    throw new Error(
      "입고 리스트에서 유효한 D열(자사상품명)·I열(수량) 데이터를 찾을 수 없습니다.",
    );
  }

  const lookup = await lookupShoplingInboundBarcodes(parsed.items);

  if (lookup.rows.length === 0) {
    const lookupError = formatShoplingInboundLookupError(lookup);

    throw new Error(
      lookupError ?? "입고 템플릿에 넣을 샵플링 바코드가 없습니다.",
    );
  }

  let templateBuffer: Buffer;

  try {
    templateBuffer = await fs.readFile(getShoplingOutboundTemplatePath());
  } catch {
    throw new Error("샵플링 WMS 템플릿 파일이 서버에 없습니다.");
  }

  const buffer = await fillShoplingOutboundTemplate(templateBuffer, lookup.rows);

  return {
    buffer,
    rows: lookup.rows,
    stats: {
      inputRows: parsed.items.length,
      outputRows: lookup.rows.length,
      skippedRows: parsed.skippedRows,
      skippedDummy: lookup.skippedDummy,
      unmapped: lookup.unmapped,
      ambiguous: lookup.ambiguous,
    },
  };
}

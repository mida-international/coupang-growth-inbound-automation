import "server-only";

import {
  buildCoupangInboundTemplateFilename,
  filterInboundTemplateWithModeC,
} from "@/lib/excel/generators/filter-inbound-template";
import { validateInboundTemplateFile } from "@/lib/excel/validators/validate-inbound-template-file";
import {
  convertVisionDataToBoxItems,
  validateVisionExtractedData,
} from "@/lib/vision/convert-vision-to-box-items";
import type { VisionExtractedData } from "@/lib/vision/types";
import type { GenerateCoupangInboundTemplateResult } from "@/services/deliverables/types";

export async function generateCoupangInboundFromVision(input: {
  templateBuffer: Buffer;
  visionData: VisionExtractedData;
}): Promise<GenerateCoupangInboundTemplateResult> {
  const validationError = validateVisionExtractedData(input.visionData);

  if (validationError) {
    throw new Error(`[이미지 OCR 오류] ${validationError}`);
  }

  const templateValidationError = validateInboundTemplateFile(input.templateBuffer);

  if (templateValidationError) {
    throw new Error(`[쿠팡 WING 입고 템플릿 오류] ${templateValidationError}`);
  }

  const { items, skippedRows, lowConfidenceRows } = convertVisionDataToBoxItems(
    input.visionData,
  );

  if (items.length === 0) {
    throw new Error(
      "박스 이미지에서 유효한 데이터가 없습니다. 바코드와 수량이 모두 식별되는 행이 있는지 확인해 주세요.",
    );
  }

  const itemsWithQty = items.filter((item) => item.quantity > 0);

  if (itemsWithQty.length === 0) {
    throw new Error(
      `박스 이미지의 모든 행이 수량 0 또는 음수입니다. 실제 입고할 수량이 0보다 큰 행이 있는지 확인해 주세요. (전체 ${items.length}건)`,
    );
  }

  const result = await filterInboundTemplateWithModeC(
    input.templateBuffer,
    items,
    {
      source: "image",
      inputFileSkippedRows: skippedRows,
      lowConfidenceRows,
    },
  );

  if (result.stats.matched === 0) {
    throw new Error(
      `박스 리스트의 모든 바코드(${result.stats.inputBarcodes}개)가 쿠팡 WING 입고 템플릿에서 찾을 수 없습니다. ` +
        `원본 템플릿을 쿠팡 WING에서 새로 다운로드한 뒤 데이터 동기화 > 쿠팡 Growth에서 다시 업로드해 주세요.`,
    );
  }

  return {
    buffer: result.buffer,
    stats: result.stats,
    matchedItems: result.matchedItems,
  };
}

export function buildVisionInboundTemplateFilename(): string {
  return buildCoupangInboundTemplateFilename("image");
}

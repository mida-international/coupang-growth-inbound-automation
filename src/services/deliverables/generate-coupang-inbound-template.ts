import {
  generateFilteredInboundTemplate,
  type BoxListInput,
} from "@/lib/excel/generators/filter-inbound-template";
import type { GenerateCoupangInboundTemplateResult } from "@/services/deliverables/types";

export async function generateCoupangInboundTemplate(input: {
  templateBuffer: Buffer;
  boxListInput: BoxListInput;
}): Promise<GenerateCoupangInboundTemplateResult> {
  const result = await generateFilteredInboundTemplate(
    input.templateBuffer,
    input.boxListInput,
  );

  return {
    buffer: result.buffer,
    stats: result.stats,
    matchedItems: result.matchedItems,
  };
}

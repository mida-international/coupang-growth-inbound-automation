import { fillShoplingInboundOriginalFile } from "@/lib/excel/generators/fill-shopling-inbound-original";
import { loadShoplingInboundInventoryRows } from "@/services/deliverables/lookup-shopling-inbound-barcodes";
import type { GenerateShoplingInboundOriginalResult } from "@/services/deliverables/types";
import type { BookType } from "xlsx";

function resolveBookTypeFromFilename(filename?: string): BookType | undefined {
  if (!filename) {
    return undefined;
  }

  const extension = filename.split(".").pop()?.toLowerCase();

  if (extension === "xls") {
    return "xls";
  }

  if (extension === "xlsx") {
    return "xlsx";
  }

  return undefined;
}

export async function generateShoplingInboundOriginalFile(input: {
  inboundListBuffer: Buffer;
  originalFileName?: string;
}): Promise<GenerateShoplingInboundOriginalResult> {
  let inventoryRows;

  try {
    inventoryRows = await loadShoplingInboundInventoryRows({
      includeLocation: true,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("샵플링 재고 데이터를 불러오지 못했습니다.");
  }

  let result;

  try {
    result = fillShoplingInboundOriginalFile(
      input.inboundListBuffer,
      inventoryRows,
      { bookType: resolveBookTypeFromFilename(input.originalFileName) },
    );
  } catch {
    throw new Error(
      "입고 리스트 파일을 읽을 수 없습니다. 파일이 손상되었거나 암호가 걸려있을 수 있습니다.",
    );
  }

  return {
    buffer: result.buffer,
    bookType: result.bookType,
    stats: result.stats,
  };
}

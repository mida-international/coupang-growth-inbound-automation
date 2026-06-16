import {
  parseBoxInboundList,
  type BoxListItem,
} from "@/lib/excel/parsers/parse-box-inbound-list";
import { SHOPLING_DUMMY_BARCODE } from "@/lib/excel/targets/shopling-gross-outbound-template";
import { validateBoxListFile } from "@/lib/excel/validators/validate-box-list-file";
import type { NormalizeOutboundBoxItemsResult } from "@/services/deliverables/types";

export function isExcludedOutboundBarcode(barcode: string): boolean {
  const trimmed = barcode.trim();

  return trimmed.length === 0 || trimmed === SHOPLING_DUMMY_BARCODE;
}

export function normalizeOutboundBoxItems(
  items: BoxListItem[],
  skippedRows = 0,
): NormalizeOutboundBoxItemsResult {
  const qtyByBarcode = new Map<string, number>();
  let skippedDummy = 0;
  let inputWithQty = 0;

  for (const item of items) {
    if (item.quantity <= 0) {
      continue;
    }

    inputWithQty += 1;

    const barcode = item.barcode.trim();

    if (isExcludedOutboundBarcode(barcode)) {
      skippedDummy += 1;
      continue;
    }

    qtyByBarcode.set(barcode, (qtyByBarcode.get(barcode) ?? 0) + item.quantity);
  }

  return {
    qtyByBarcode,
    inputTotal: items.length,
    inputWithQty,
    inputBarcodes: qtyByBarcode.size,
    skippedDummy,
    skippedRows,
  };
}

export function normalizeOutboundBoxListFromBuffer(
  buffer: ArrayBuffer | Buffer,
): NormalizeOutboundBoxItemsResult {
  const validationError = validateBoxListFile(buffer);

  if (validationError) {
    throw new Error(`[출고 리스트 오류] ${validationError}`);
  }

  const { items, skippedRows } = parseBoxInboundList(buffer);

  return normalizeOutboundBoxItems(items, skippedRows);
}

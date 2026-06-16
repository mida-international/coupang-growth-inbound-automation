import ExcelJS from "exceljs";

import { getKstTodayDate } from "@/lib/date/kst-today";
import {
  buildBarcodeQtyMap,
  parseBoxInboundList,
  type BoxListItem,
} from "@/lib/excel/parsers/parse-box-inbound-list";
import { validateBoxListFile } from "@/lib/excel/validators/validate-box-list-file";
import { validateInboundTemplateFile } from "@/lib/excel/validators/validate-inbound-template-file";
import type {
  BoxListSource,
  FilterInboundTemplateStats,
  MatchedInboundTemplateItem,
} from "@/services/deliverables/types";

const INBOUND_LAYOUT = {
  headerRow0: 0,
  headerRow1: 1,
  headerRow2: 2,
  exampleRow: 3,
  dataStartRow: 4,
  optionIdCol: 6,
  quantityCol: 21,
  barcodeCol: 27,
} as const;

export type VisionExtractedData = {
  columns: string[];
  rows: Record<string, string>[];
};

export type BoxListInput =
  | { source: "excel"; boxListBuffer: ArrayBuffer | Buffer }
  | { source: "image"; visionData: VisionExtractedData };

export type FilterInboundTemplateResult = {
  buffer: Buffer;
  stats: FilterInboundTemplateStats;
  matchedItems: MatchedInboundTemplateItem[];
};

function formatKstIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function buildCoupangInboundTemplateFilename(
  source: BoxListSource,
  date = getKstTodayDate(),
): string {
  const sourceTag = source === "image" ? "이미지" : "엑셀";
  const datePart = formatKstIsoDate(date);

  return `쿠팡_입고템플릿_생성_${sourceTag}_C_${datePart}.xlsx`;
}

export function convertVisionRowsToBoxList(visionData: VisionExtractedData): {
  items: BoxListItem[];
  skippedRows: number;
  lowConfidenceRows: number;
} {
  const items: BoxListItem[] = [];
  let skippedRows = 0;
  let lowConfidenceRows = 0;

  const barcodeCol = visionData.columns.find((column) =>
    /바코드|barcode|상품코드|code|sku|품번|ean|upc|gtin/i.test(column),
  );
  const qtyCol =
    visionData.columns.find((column) => /^가용$|가용수량/.test(column)) ??
    visionData.columns.find((column) =>
      /수량|qty|quantity|개수|pcs|ea/i.test(column),
    );

  if (!barcodeCol || !qtyCol) {
    return {
      items: [],
      skippedRows: visionData.rows.length,
      lowConfidenceRows: 0,
    };
  }

  for (const row of visionData.rows) {
    const barcodeRaw = row[barcodeCol];
    const qtyRaw = row[qtyCol];

    if (!barcodeRaw || !qtyRaw) {
      skippedRows += 1;
      continue;
    }

    const barcode = String(barcodeRaw).trim().replace(/\s/g, "");

    if (!/^\d{6,14}$/.test(barcode)) {
      skippedRows += 1;
      continue;
    }

    const quantity = parseInt(String(qtyRaw).replace(/[^\d-]/g, ""), 10);

    if (Number.isNaN(quantity)) {
      skippedRows += 1;
      continue;
    }

    const confidence = Number(row.confidence);
    const validConfidence = Number.isNaN(confidence) ? 1 : confidence;

    if (validConfidence < 0.7) {
      lowConfidenceRows += 1;
    }

    items.push({
      barcode,
      quantity,
      productName: row["등록상품명"] || row["상품명"] || undefined,
      optionName: row["옵션명"] || row["옵션"] || undefined,
      location: row.location || row["로케이션"] || row["위치"] || undefined,
      box: row.box || row["박스"] || undefined,
      ocrConfidence: validConfidence,
    });
  }

  return { items, skippedRows, lowConfidenceRows };
}

export function validateVisionBoxListData(
  visionData: VisionExtractedData,
): string | null {
  if (!Array.isArray(visionData.columns) || !Array.isArray(visionData.rows)) {
    return "Vision OCR 결과 형식이 올바르지 않습니다.";
  }

  if (visionData.rows.length === 0) {
    return "이미지에서 표 데이터를 추출하지 못했습니다. 사진이 선명한지 확인하거나 다른 각도로 촬영해주세요.";
  }

  const hasBarcodeCol = visionData.columns.some((column) =>
    /바코드|barcode|상품코드|code|sku|품번/i.test(column),
  );
  const hasQtyCol = visionData.columns.some((column) =>
    /수량|qty|quantity|가용/i.test(column),
  );

  if (!hasBarcodeCol || !hasQtyCol) {
    return (
      `이미지에서 바코드 또는 수량 컬럼을 찾을 수 없습니다. ` +
      `인식된 컬럼: ${visionData.columns.slice(0, 6).join(", ")}. ` +
      `표 전체가 선명하게 보이는 사진을 사용해주세요.`
    );
  }

  return null;
}

export function parseBoxListInput(input: BoxListInput): {
  items: BoxListItem[];
  skippedRows: number;
  lowConfidenceRows: number;
} {
  if (input.source === "excel") {
    const validationError = validateBoxListFile(input.boxListBuffer);

    if (validationError) {
      throw new Error(`[박스 입고 리스트 오류] ${validationError}`);
    }

    const { items, skippedRows } = parseBoxInboundList(input.boxListBuffer);

    return { items, skippedRows, lowConfidenceRows: 0 };
  }

  const validationError = validateVisionBoxListData(input.visionData);

  if (validationError) {
    throw new Error(`[이미지 OCR 오류] ${validationError}`);
  }

  return convertVisionRowsToBoxList(input.visionData);
}

export async function filterInboundTemplateWithModeC(
  templateBuffer: ArrayBuffer | Buffer,
  boxItems: BoxListItem[],
  options: {
    source: BoxListSource;
    inputFileSkippedRows?: number;
    lowConfidenceRows?: number;
    barcodeQtyOverride?: Map<string, number>;
  },
): Promise<FilterInboundTemplateResult> {
  const qtyMap = buildBarcodeQtyMap(boxItems, options.barcodeQtyOverride);
  const unmatched = new Set(qtyMap.keys());
  const matchedItems: MatchedInboundTemplateItem[] = [];

  const workbook = new ExcelJS.Workbook();
  const data = Buffer.isBuffer(templateBuffer)
    ? templateBuffer
    : Buffer.from(templateBuffer);
  // exceljs Buffer typings differ from Node @types/node Buffer in TS 5.x
  await workbook.xlsx.load(data as unknown as ExcelJS.Buffer);

  let matched = 0;
  let originalDataRows = 0;
  let finalDataRows = 0;

  workbook.eachSheet((worksheet) => {
    if (worksheet.name.includes("사용법") || worksheet.name.includes("유의사항")) {
      return;
    }

    const lastRow = worksheet.rowCount;
    const dataStart = INBOUND_LAYOUT.dataStartRow + 1;
    const qtyCol = INBOUND_LAYOUT.quantityCol + 1;
    const barcodeCol = INBOUND_LAYOUT.barcodeCol + 1;
    const optionIdCol = INBOUND_LAYOUT.optionIdCol + 1;

    originalDataRows += Math.max(0, lastRow - dataStart + 1);

    const rowsToRemove: number[] = [];

    for (let rowIndex = dataStart; rowIndex <= lastRow; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const barcodeCell = row.getCell(barcodeCol);
      const barcode =
        barcodeCell.value != null ? String(barcodeCell.value).trim() : "";
      const qty = barcode ? qtyMap.get(barcode) : undefined;

      if (qty !== undefined) {
        row.getCell(qtyCol).value = qty;
        matched += 1;
        unmatched.delete(barcode);

        const optionCell = row.getCell(optionIdCol);
        const optionId =
          optionCell.value != null ? String(optionCell.value).trim() : "";

        matchedItems.push({
          productBarcode: barcode,
          coupangOptionId: optionId,
          quantity: qty,
        });
      } else {
        rowsToRemove.push(rowIndex);
      }
    }

    for (let index = rowsToRemove.length - 1; index >= 0; index -= 1) {
      worksheet.spliceRows(rowsToRemove[index], 1);
    }

    finalDataRows += matched;
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    stats: {
      source: options.source,
      inputTotal: boxItems.length,
      inputWithQty: boxItems.filter((item) => item.quantity > 0).length,
      inputBarcodes: qtyMap.size,
      matched,
      unmatched: Array.from(unmatched),
      originalRows: originalDataRows,
      finalRows: finalDataRows,
      inputFileSkippedRows: options.inputFileSkippedRows ?? 0,
      lowConfidenceRows: options.lowConfidenceRows,
    },
    matchedItems,
  };
}

export async function generateFilteredInboundTemplate(
  templateBuffer: ArrayBuffer | Buffer,
  boxListInput: BoxListInput,
  options?: {
    barcodeQtyOverride?: Map<string, number>;
  },
): Promise<FilterInboundTemplateResult> {
  const templateValidationError = validateInboundTemplateFile(templateBuffer);

  if (templateValidationError) {
    throw new Error(`[쿠팡 WING 입고 템플릿 오류] ${templateValidationError}`);
  }

  const {
    items: boxItems,
    skippedRows,
    lowConfidenceRows,
  } = parseBoxListInput(boxListInput);

  if (boxItems.length === 0) {
    const sourceLabel =
      boxListInput.source === "excel" ? "박스 입고 리스트" : "박스 이미지";

    throw new Error(
      `${sourceLabel}에서 유효한 데이터가 없습니다. 바코드와 수량이 모두 식별되는 행이 있는지 확인해주세요.`,
    );
  }

  const itemsWithQty = boxItems.filter((item) => item.quantity > 0);

  if (itemsWithQty.length === 0) {
    throw new Error(
      `박스 입고 리스트의 모든 행이 수량 0 또는 음수입니다. 실제 입고할 수량이 0보다 큰 행이 있는지 확인해주세요. (전체 ${boxItems.length}건)`,
    );
  }

  const result = await filterInboundTemplateWithModeC(
    templateBuffer,
    boxItems,
    {
      source: boxListInput.source,
      inputFileSkippedRows: skippedRows,
      lowConfidenceRows,
      barcodeQtyOverride: options?.barcodeQtyOverride,
    },
  );

  if (result.stats.matched === 0) {
    throw new Error(
      `박스 리스트의 모든 바코드(${result.stats.inputBarcodes}개)가 쿠팡 WING 입고 템플릿에서 찾을 수 없습니다. ` +
        `원본 템플릿을 쿠팡 WING에서 새로 다운로드한 뒤 데이터 동기화 > 쿠팡 Growth에서 다시 업로드해주세요.`,
    );
  }

  return result;
}

import type { BoxListItem } from "@/lib/excel/parsers/parse-box-inbound-list";
import type { VisionExtractedData } from "@/lib/vision/types";

export function convertVisionDataToBoxItems(visionData: VisionExtractedData): {
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

    if (!barcodeRaw || qtyRaw === undefined || qtyRaw === "") {
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

    const confidence = Number(row.confidence ?? row["confidence"]);
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

export function validateVisionExtractedData(
  visionData: VisionExtractedData,
): string | null {
  if (!Array.isArray(visionData.columns) || !Array.isArray(visionData.rows)) {
    return "Vision OCR 결과 형식이 올바르지 않습니다.";
  }

  if (visionData.rows.length === 0) {
    return "이미지에서 표 데이터를 추출하지 못했습니다. 사진이 선명한지 확인하거나 다른 각도로 촬영해 주세요.";
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
      `표 전체가 선명하게 보이는 사진을 사용해 주세요.`
    );
  }

  return null;
}

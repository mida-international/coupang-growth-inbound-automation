/** Vision OCR 모듈 전용 타입 (기존 excel/ 필터 로직과 분리) */

export type VisionExtractedRow = Record<string, string> & {
  confidence?: string;
};

export type VisionExtractedData = {
  columns: string[];
  rows: VisionExtractedRow[];
};

export type VisionExtractStats = {
  imageCount: number;
  rowCount: number;
  validBarcodeRows: number;
  skippedRows: number;
  lowConfidenceRows: number;
  correctionCount: number;
  boxNumbers: string[];
};

export type VisionExtractResult = {
  visionData: VisionExtractData;
  stats: VisionExtractStats;
};

/** @deprecated alias for internal consistency */
export type VisionExtractData = VisionExtractedData;

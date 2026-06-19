import type { ParsedCenterSeparationRow } from "@/lib/excel/parsers/parse-center-separation";

export type CenterSeparationServiceResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      missingBarcodes?: string[];
      existingBarcodes?: string[];
    };

export type CenterSeparationRowView = {
  id: string;
  barcode: string;
  registeredProductName: string | null;
  optionName: string | null;
  ptnGoodsCd: string | null;
  shoplingOptionValue: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListCenterSeparationResult = {
  totalCount: number;
  rows: CenterSeparationRowView[];
};

export type DeleteCenterSeparationResult = {
  deletedCount: number;
};

export type UpsertCenterSeparationStats = {
  inputRows: number;
  upserted: number;
  created: number;
  updated: number;
  skippedEmptyBarcode: number;
  errors: string[];
};

export type UpsertCenterSeparationResult = {
  stats: UpsertCenterSeparationStats;
  missingBarcodes: string[];
  existingBarcodes: string[];
};

export const CENTER_SEPARATION_UNLINKED_BARCODE_NOTICE =
  "등록됐으나 쿠팡 대시보드 상품정보가 아직 연동되지 않았습니다.";

export const CENTER_SEPARATION_ALREADY_EXISTS_ERROR =
  "이미 등록된 바코드입니다.";

export const CENTER_SEPARATION_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const CENTER_SEPARATION_DEFAULT_PAGE_SIZE = 50;

export function normalizeCenterSeparationPageSize(value?: number): number {
  if (
    value !== undefined &&
    CENTER_SEPARATION_PAGE_SIZE_OPTIONS.includes(
      value as (typeof CENTER_SEPARATION_PAGE_SIZE_OPTIONS)[number],
    )
  ) {
    return value;
  }

  return CENTER_SEPARATION_DEFAULT_PAGE_SIZE;
}

export type CenterSeparationBarcodeRow = ParsedCenterSeparationRow;

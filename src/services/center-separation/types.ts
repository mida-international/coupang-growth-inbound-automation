import type { ParsedCenterSeparationRow } from "@/lib/excel/parsers/parse-center-separation";

export type CenterSeparationServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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
};

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

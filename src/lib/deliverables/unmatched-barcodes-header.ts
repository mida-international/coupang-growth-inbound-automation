export type UnmatchedBarcodeItem = {
  barcode: string;
  quantity: number;
};

export const UNMATCHED_BARCODES_HEADER = "X-Filter-Unmatched-Barcodes";

// 응답 헤더 크기 제한을 넘지 않도록 전달 개수를 제한한다 (항목당 약 20바이트).
export const UNMATCHED_BARCODES_HEADER_LIMIT = 500;

/** `바코드:수량,바코드:수량` 형식. 헤더는 ASCII만 허용하므로 바코드는 URI 인코딩한다. */
export function encodeUnmatchedBarcodesHeader(
  items: UnmatchedBarcodeItem[],
): string {
  return items
    .slice(0, UNMATCHED_BARCODES_HEADER_LIMIT)
    .map((item) => `${encodeURIComponent(item.barcode)}:${item.quantity}`)
    .join(",");
}

export function decodeUnmatchedBarcodesHeader(
  value: string | null,
): UnmatchedBarcodeItem[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => {
      const separatorIndex = entry.lastIndexOf(":");

      if (separatorIndex <= 0) {
        return null;
      }

      const barcode = decodeURIComponent(entry.slice(0, separatorIndex));
      const quantity = Number(entry.slice(separatorIndex + 1));

      return Number.isFinite(quantity) ? { barcode, quantity } : null;
    })
    .filter((item): item is UnmatchedBarcodeItem => item !== null);
}

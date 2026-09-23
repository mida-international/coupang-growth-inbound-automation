import {
  decodeUnmatchedBarcodesHeader,
  UNMATCHED_BARCODES_HEADER,
  type UnmatchedBarcodeItem,
} from "@/lib/deliverables/unmatched-barcodes-header";

export type CoupangInboundTemplateDownloadResult = {
  message: string;
  unmatchedBarcodes: UnmatchedBarcodeItem[];
  unmatchedCount: number;
};

export async function downloadCoupangInboundTemplate(
  sellerId: string,
  boxListFile: File,
): Promise<CoupangInboundTemplateDownloadResult> {
  const formData = new FormData();
  formData.append("seller", sellerId);
  formData.append("boxListFile", boxListFile);

  const response = await fetch("/api/downloads/coupang-inbound-template", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "입고 템플릿 생성에 실패했습니다.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const filename = filenameMatch
    ? decodeURIComponent(filenameMatch[1])
    : "쿠팡_입고템플릿_생성.xlsx";

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);

  const matched = response.headers.get("X-Filter-Matched");
  const matchedQuantity = response.headers.get("X-Filter-Matched-Quantity");
  const unmatched = response.headers.get("X-Filter-Unmatched");
  const statsParts = [
    matched !== null ? `매칭 ${matched}건` : null,
    matchedQuantity !== null
      ? `수량 ${Number(matchedQuantity).toLocaleString()}개`
      : null,
    unmatched !== null ? `미매칭 ${unmatched}건` : null,
  ].filter(Boolean);

  return {
    message:
      statsParts.length > 0
        ? `${statsParts.join(", ")} — 파일을 다운로드했습니다.`
        : "입고 템플릿 파일을 다운로드했습니다.",
    unmatchedBarcodes: decodeUnmatchedBarcodesHeader(
      response.headers.get(UNMATCHED_BARCODES_HEADER),
    ),
    unmatchedCount: Number(unmatched ?? 0),
  };
}

export type CoupangInboundDownloadResult = {
  /** 알림에 그대로 쓸 요약 문구(매칭·수량·미매칭 건수 포함). */
  message: string;
  matched: number | null;
  /** 매칭된 행들의 수량 총합. */
  quantitySum: number | null;
  unmatched: number | null;
  /** 미매칭 바코드 목록(최대 500개). */
  unmatchedBarcodes: string[];
};

function toNumberOrNull(value: string | null): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function downloadCoupangInboundTemplate(
  sellerId: string,
  boxListFile: File,
): Promise<CoupangInboundDownloadResult> {
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

  const matched = toNumberOrNull(response.headers.get("X-Filter-Matched"));
  const unmatched = toNumberOrNull(response.headers.get("X-Filter-Unmatched"));
  const quantitySum = toNumberOrNull(
    response.headers.get("X-Filter-Quantity-Sum"),
  );
  const unmatchedBarcodesRaw =
    response.headers.get("X-Filter-Unmatched-Barcodes") ?? "";
  const unmatchedBarcodes = unmatchedBarcodesRaw
    ? unmatchedBarcodesRaw.split(",").filter((code) => code.length > 0)
    : [];

  const statsParts = [
    matched !== null ? `매칭 ${matched}건` : null,
    quantitySum !== null ? `수량 ${quantitySum}건` : null,
    unmatched !== null ? `미매칭 ${unmatched}건` : null,
  ].filter((part): part is string => part !== null);

  const message =
    statsParts.length > 0
      ? `${statsParts.join(", ")} — 파일을 다운로드했습니다.`
      : "입고 템플릿 파일을 다운로드했습니다.";

  return { message, matched, quantitySum, unmatched, unmatchedBarcodes };
}

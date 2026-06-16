export async function downloadShoplingOutboundTemplate(
  sellerId: string,
  boxListFile: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("seller", sellerId);
  formData.append("boxListFile", boxListFile);

  const response = await fetch("/api/downloads/shopling-outbound-template", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      payload?.error ?? "샵플링 출고 템플릿 생성에 실패했습니다.",
    );
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const filename = filenameMatch
    ? decodeURIComponent(filenameMatch[1])
    : "shopling_gross_outbound.xlsx";

  const outboundRows = response.headers.get("X-Outbound-Rows");
  const packagesDecomposed = response.headers.get(
    "X-Outbound-Packages-Decomposed",
  );
  const skippedPackages = response.headers.get("X-Outbound-Skipped-Packages");

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);

  const statsParts = [
    outboundRows !== null ? `출고 ${outboundRows}건` : null,
    packagesDecomposed !== null && Number(packagesDecomposed) > 0
      ? `패키지 분해 ${packagesDecomposed}건`
      : null,
    skippedPackages !== null && Number(skippedPackages) > 0
      ? `미매핑 패키지 ${skippedPackages}건 스킵`
      : null,
  ].filter(Boolean);

  return statsParts.length > 0
    ? `${statsParts.join(", ")} — 파일을 다운로드했습니다.`
    : "샵플링 출고 템플릿 파일을 다운로드했습니다.";
}

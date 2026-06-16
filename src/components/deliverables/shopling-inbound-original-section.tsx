"use client";

import { useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { ExcelDropzone } from "@/components/excel/excel-dropzone";
import { Button } from "@/components/ui/button";

export function ShoplingInboundOriginalSection() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const canDownload = excelFile !== null && !isDownloading;

  async function handleDownloadClick() {
    if (!canDownload || !excelFile) {
      return;
    }

    setIsDownloading(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("inboundListFile", excelFile);

      const response = await fetch("/api/downloads/shopling-inbound-original", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "원본파일 생성에 실패했습니다.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : excelFile.name;

      const matched = response.headers.get("X-Inbound-Matched");
      const unmapped = response.headers.get("X-Inbound-Unmapped");
      const ambiguous = response.headers.get("X-Inbound-Ambiguous");

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      const statsParts = [
        matched !== null ? `매칭 ${matched}건` : null,
        unmapped !== null && Number(unmapped) > 0
          ? `미매핑 ${unmapped}건`
          : null,
        ambiguous !== null && Number(ambiguous) > 0
          ? `모호한 매칭 ${ambiguous}건`
          : null,
      ].filter(Boolean);

      setNotice(
        statsParts.length > 0
          ? `${statsParts.join(", ")} — 원본파일을 다운로드했습니다.`
          : "원본파일을 다운로드했습니다.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "원본파일 생성에 실패했습니다.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <DeliverablesSection
      title="원본파일 생성하기"
      description="입고 리스트 원본을 업로드하면 D(品名)·E(옵션)으로 샵플링을 조회해 C(Location)·F(바코드)를 채운 뒤 같은 형식으로 다운로드합니다."
      variant="plain"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-muted/20 p-4">
          <p className="mb-3 text-sm font-medium text-foreground">
            입고 리스트 업로드
          </p>

          <ExcelDropzone
            multiple={false}
            description={
              excelFile
                ? excelFile.name
                : "엑셀 파일을 드래그하거나 클릭하여 선택"
            }
            onFilesSelected={(files) => {
              setExcelFile(files[0] ?? null);
              setNotice(null);
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            D(品名)·E(옵션)으로 조회하며 I(수량)은 무관합니다. 매칭 실패 행은
            C·F를 비웁니다.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            size="sm"
            disabled={!canDownload}
            onClick={handleDownloadClick}
          >
            {isDownloading ? "생성 중..." : "다운로드"}
          </Button>
        </div>

        {!excelFile ? (
          <p className="text-sm text-muted-foreground">
            입고 리스트 엑셀 파일을 선택해 주세요.
          </p>
        ) : null}

        {notice ? (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        ) : null}
      </div>
    </DeliverablesSection>
  );
}

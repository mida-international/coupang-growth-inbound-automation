"use client";

import { useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { ExcelDropzone } from "@/components/excel/excel-dropzone";
import { Button } from "@/components/ui/button";

export function ShoplingInboundTemplateSection() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [canRecordInbound, setCanRecordInbound] = useState(false);
  const canDownload = excelFile !== null && !isDownloading && !isRecording;

  function handleRecordInboundClick() {
    if (!canRecordInbound || isRecording || isDownloading) {
      return;
    }

    setIsRecording(true);
    setNotice("입고 기록 기능은 준비 중입니다.");
    setIsRecording(false);
  }

  async function handleDownloadClick() {
    if (!canDownload || !excelFile) {
      return;
    }

    setIsDownloading(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("inboundListFile", excelFile);

      const response = await fetch("/api/downloads/shopling-inbound-template", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          payload?.error ?? "샵플링 입고 템플릿 생성에 실패했습니다.",
        );
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : "shopling_gross_inbound.xlsx";

      const inboundRows = response.headers.get("X-Inbound-Rows");
      const skippedRows = response.headers.get("X-Inbound-Skipped-Rows");
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
        inboundRows !== null ? `입고 ${inboundRows}건` : null,
        skippedRows !== null && Number(skippedRows) > 0
          ? `스킵 ${skippedRows}행`
          : null,
        unmapped !== null && Number(unmapped) > 0
          ? `미매핑 ${unmapped}건`
          : null,
        ambiguous !== null && Number(ambiguous) > 0
          ? `모호한 매칭 ${ambiguous}건`
          : null,
      ].filter(Boolean);

      setNotice(
        statsParts.length > 0
          ? `${statsParts.join(", ")} — 파일을 다운로드했습니다.`
          : "샵플링 입고 템플릿 파일을 다운로드했습니다.",
      );
      setCanRecordInbound(true);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "샵플링 입고 템플릿 생성에 실패했습니다.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <DeliverablesSection
      title="샵플링 입고 템플릿 생성"
      description="중국어 입고 리스트(엑셀)를 업로드한 뒤, 샵플링 WMS 입고용 엑셀을 생성합니다."
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
              setCanRecordInbound(false);
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            필수 열: D(자사상품명), E(옵션), I(수량)
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canRecordInbound || isRecording || isDownloading}
            onClick={handleRecordInboundClick}
          >
            {isRecording ? "기록 중..." : "입고 기록하기"}
          </Button>
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

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import {
  DeliverablesActionBar,
  DELIVERABLES_PRIMARY_BUTTON_CLASS,
} from "@/components/deliverables/deliverables-action-bar";
import { ExcelDropzone } from "@/components/excel/excel-dropzone";
import { ShoplingInboundValidationTable } from "@/components/deliverables/shopling-inbound-validation-table";
import { Button } from "@/components/ui/button";
import type { ShoplingInboundValidationRow } from "@/services/deliverables/types";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type ShoplingInboundTemplateResponse =
  | {
      ok: true;
      data: {
        fileName: string;
        fileBase64: string;
        stats: {
          inputRows: number;
          outputRows: number;
          skippedRows: number;
          skippedDummy: number;
          unmapped: number;
          ambiguous: number;
        };
        validation: ShoplingInboundValidationRow[];
      };
    }
  | { ok: false; error?: string }
  | null;

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

export function ShoplingInboundTemplateSection() {
  const router = useRouter();
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [canRecordInbound, setCanRecordInbound] = useState(false);
  const [validation, setValidation] = useState<
    ShoplingInboundValidationRow[] | null
  >(null);
  const canDownload = excelFile !== null && !isDownloading && !isRecording;

  async function handleRecordInboundClick() {
    if (!canRecordInbound || isRecording || isDownloading || !excelFile) {
      return;
    }

    setIsRecording(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("inboundListFile", excelFile);

      const response = await fetch("/api/shopling-inbound-deliverables", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok: true; data: { recordedCount: number } }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !payload || !("ok" in payload) || !payload.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "입고 기록에 실패했습니다.",
        );
      }

      setNotice(
        `${payload.data.recordedCount}개 바코드 입고를 기록했습니다.`,
      );
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "입고 기록에 실패했습니다.",
      );
    } finally {
      setIsRecording(false);
    }
  }

  async function handleDownloadClick() {
    if (!canDownload || !excelFile) {
      return;
    }

    setIsDownloading(true);
    setNotice(null);
    setValidation(null);

    try {
      const formData = new FormData();
      formData.append("inboundListFile", excelFile);

      const response = await fetch("/api/downloads/shopling-inbound-template", {
        method: "POST",
        body: formData,
      });

      const payload = (await response
        .json()
        .catch(() => null)) as ShoplingInboundTemplateResponse;

      if (!response.ok || !payload || !payload.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "샵플링 입고 템플릿 생성에 실패했습니다.",
        );
      }

      const { fileName, fileBase64, stats, validation: validationRows } =
        payload.data;

      const blob = base64ToBlob(fileBase64, XLSX_MIME_TYPE);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      const statsParts = [
        `입고 ${stats.outputRows}건`,
        stats.skippedRows > 0 ? `스킵 ${stats.skippedRows}행` : null,
        stats.unmapped > 0 ? `미매핑 ${stats.unmapped}건` : null,
        stats.ambiguous > 0 ? `모호한 매칭 ${stats.ambiguous}건` : null,
      ].filter(Boolean);

      setNotice(`${statsParts.join(", ")} — 파일을 다운로드했습니다.`);
      setValidation(validationRows);
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
              setValidation(null);
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            필수 열: D(자사상품명), E(옵션), I(수량)
          </p>
        </div>

        <DeliverablesActionBar
          center={
            <Button
              type="button"
              size="default"
              className={DELIVERABLES_PRIMARY_BUTTON_CLASS}
              disabled={!canDownload}
              onClick={handleDownloadClick}
            >
              {isDownloading ? "생성 중..." : "다운로드"}
            </Button>
          }
          end={
            <Button
              type="button"
              variant="outline"
              size="default"
              className={DELIVERABLES_PRIMARY_BUTTON_CLASS}
              disabled={!canRecordInbound || isRecording || isDownloading}
              onClick={handleRecordInboundClick}
            >
              {isRecording ? "기록 중..." : "기록하기"}
            </Button>
          }
        />

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

        {validation ? (
          <ShoplingInboundValidationTable rows={validation} />
        ) : null}
      </div>
    </DeliverablesSection>
  );
}

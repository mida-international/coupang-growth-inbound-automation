"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  DeliverablesActionBar,
  DELIVERABLES_PRIMARY_BUTTON_CLASS,
} from "@/components/deliverables/deliverables-action-bar";
import { VisionExtractPreviewTable } from "@/components/deliverables/vision/vision-extract-preview-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { downloadCoupangInboundTemplate } from "@/lib/deliverables/client/download-coupang-inbound-template";
import { downloadShoplingOutboundTemplate } from "@/lib/deliverables/client/download-shopling-outbound-template";
import { recordCoupangInbound } from "@/lib/deliverables/client/record-coupang-inbound";
import { cn } from "@/lib/utils";
import type { VisionExtractedData } from "@/lib/vision/types";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type TelegramCoupangTemplatePanelProps = {
  uploadId: string;
  outputFileName: string;
  accounts: SellerAccountView[];
};

type TemplateMeta = {
  exists: boolean;
  updatedAt: string | null;
};

function formatTemplateDate(iso: string | null): string {
  if (!iso) {
    return "-";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TelegramCoupangTemplatePanel({
  uploadId,
  outputFileName,
  accounts,
}: TelegramCoupangTemplatePanelProps) {
  const [sellerId, setSellerId] = useState("");
  const [boxListFile, setBoxListFile] = useState<File | null>(null);
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null);
  const [isLoadingTemplateMeta, setIsLoadingTemplateMeta] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingShoplingOutbound, setIsDownloadingShoplingOutbound] =
    useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [canRecordInbound, setCanRecordInbound] = useState(false);
  const [previewData, setPreviewData] = useState<VisionExtractedData | null>(
    null,
  );
  const [previewState, setPreviewState] = useState<
    "loading" | "loaded" | "unavailable" | "error"
  >("loading");

  const hasSeller = sellerId.trim().length > 0;
  const hasStoredTemplate = templateMeta?.exists === true;
  const selectedAccount = accounts.find((account) => account.id === sellerId);
  const canDownload = hasSeller && hasStoredTemplate && !isDownloading;
  const canDownloadShoplingOutbound =
    hasSeller && !isDownloadingShoplingOutbound;

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      try {
        const response = await fetch(
          `/api/telegram/box-list-uploads/${encodeURIComponent(uploadId)}`,
        );
        const payload = (await response.json().catch(() => null)) as
          | { ok: true; data: { visionData: VisionExtractedData | null } }
          | { ok: false; error?: string }
          | null;

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload || !payload.ok) {
          setPreviewState("error");
          return;
        }

        if (payload.data.visionData) {
          setPreviewData(payload.data.visionData);
          setPreviewState("loaded");
        } else {
          setPreviewState("unavailable");
        }
      } catch {
        if (!cancelled) {
          setPreviewState("error");
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [uploadId]);

  useEffect(() => {
    if (!hasSeller) {
      setTemplateMeta(null);
      return;
    }

    let cancelled = false;

    async function loadTemplateMeta() {
      setIsLoadingTemplateMeta(true);

      try {
        const response = await fetch(
          `/api/downloads/latest-inbound-template?seller=${encodeURIComponent(sellerId)}`,
          { method: "HEAD" },
        );

        if (cancelled) {
          return;
        }

        if (response.status === 404) {
          setTemplateMeta({ exists: false, updatedAt: null });
          return;
        }

        if (!response.ok) {
          setTemplateMeta(null);
          return;
        }

        setTemplateMeta({
          exists: true,
          updatedAt: response.headers.get("X-Template-Updated-At"),
        });
      } catch {
        if (!cancelled) {
          setTemplateMeta(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTemplateMeta(false);
        }
      }
    }

    void loadTemplateMeta();

    return () => {
      cancelled = true;
    };
  }, [hasSeller, sellerId]);

  // 저장된 텔레그램 OCR 엑셀을 그대로 박스 입고 리스트 입력으로 재사용한다.
  async function resolveBoxListFile(): Promise<File> {
    if (boxListFile) {
      return boxListFile;
    }

    const response = await fetch(
      `/api/telegram/box-list-uploads/${encodeURIComponent(uploadId)}/download`,
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(
        payload?.error ?? "저장된 OCR 엑셀을 불러오지 못했습니다.",
      );
    }

    const blob = await response.blob();
    const file = new File([blob], outputFileName, { type: XLSX_MIME_TYPE });
    setBoxListFile(file);
    return file;
  }

  async function handleDownloadClick() {
    if (!canDownload) {
      return;
    }

    setIsDownloading(true);
    setNotice(null);

    try {
      const file = await resolveBoxListFile();
      const noticeMessage = await downloadCoupangInboundTemplate(
        sellerId,
        file,
      );
      setNotice(noticeMessage);
      setCanRecordInbound(true);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "입고 템플릿 생성에 실패했습니다.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleShoplingOutboundClick() {
    if (!canDownloadShoplingOutbound) {
      return;
    }

    setIsDownloadingShoplingOutbound(true);
    setNotice(null);

    try {
      const file = await resolveBoxListFile();
      const noticeMessage = await downloadShoplingOutboundTemplate(
        sellerId,
        file,
      );
      setNotice(noticeMessage);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "샵플링 출고 템플릿 생성에 실패했습니다.",
      );
    } finally {
      setIsDownloadingShoplingOutbound(false);
    }
  }

  async function handleRecordInboundClick() {
    if (!canRecordInbound || !hasSeller) {
      return;
    }

    setIsRecording(true);
    setNotice(null);

    try {
      const file = await resolveBoxListFile();
      const recordedCount = await recordCoupangInbound(sellerId, file);
      setNotice(`${recordedCount}개 바코드 입고를 기록했습니다.`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "입고 기록에 실패했습니다.",
      );
    } finally {
      setIsRecording(false);
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          등록된 판매자 계정이 없습니다.
        </p>
        <Button
          render={<Link href="/data/coupang-growth/seller-accounts" />}
          variant="link"
          className="mt-2 h-auto p-0"
        >
          쿠팡 판매자 계정 관리로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-md border border-border bg-muted/20 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          쿠팡그로스 입고 템플릿 생성
        </p>
        <p className="text-xs text-muted-foreground">
          저장된 OCR 엑셀({outputFileName})을 입고 리스트로 사용해 쿠팡 WING
          입고 템플릿에 수량을 반영합니다.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">인식결과 미리보기</p>
        {previewState === "loading" ? (
          <p className="text-sm text-muted-foreground">
            인식 데이터를 불러오는 중...
          </p>
        ) : previewState === "loaded" && previewData ? (
          <VisionExtractPreviewTable visionData={previewData} />
        ) : previewState === "unavailable" ? (
          <p className="text-sm text-muted-foreground">
            이 기록은 원본 인식 데이터가 저장되기 전에 처리되어 미리보기를
            제공하지 않습니다. 템플릿 생성은 정상적으로 가능합니다.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            인식 데이터를 불러오지 못했습니다.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={sellerId || undefined}
          onValueChange={(value) => {
            if (value) {
              setSellerId(value);
              setCanRecordInbound(false);
              setNotice(null);
            }
          }}
        >
          <SelectTrigger
            className="h-9 w-full min-w-[12rem] max-w-sm bg-background"
            aria-label="쿠팡 판매자 계정"
          >
            <span
              className={cn(
                "truncate",
                !selectedAccount && "text-muted-foreground",
              )}
            >
              {selectedAccount?.displayName ?? "판매자 계정 선택"}
            </span>
          </SelectTrigger>
          <SelectContent align="start">
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {isLoadingTemplateMeta ? (
          "WING 입고 템플릿 확인 중..."
        ) : hasStoredTemplate ? (
          <>
            저장된 최신 WING 템플릿:{" "}
            {formatTemplateDate(templateMeta?.updatedAt ?? null)}
          </>
        ) : hasSeller ? (
          <>
            저장된 WING 템플릿 없음 —{" "}
            <Link
              href="/sync/coupang-growth/excel-upload"
              className="text-primary underline-offset-4 hover:underline"
            >
              데이터 동기화 &gt; 쿠팡 Growth
            </Link>
            에서 먼저 업로드해 주세요.
          </>
        ) : (
          "판매자 계정을 선택하면 WING 템플릿 상태를 확인합니다."
        )}
      </p>

      <DeliverablesActionBar
        center={
          <>
            <Button
              type="button"
              size="default"
              className={DELIVERABLES_PRIMARY_BUTTON_CLASS}
              disabled={
                !canDownload || isRecording || isDownloadingShoplingOutbound
              }
              onClick={handleDownloadClick}
            >
              {isDownloading ? "생성 중..." : "다운로드"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              className={DELIVERABLES_PRIMARY_BUTTON_CLASS}
              disabled={
                !canDownloadShoplingOutbound || isDownloading || isRecording
              }
              onClick={handleShoplingOutboundClick}
            >
              {isDownloadingShoplingOutbound
                ? "생성 중..."
                : "샵플링 출고 템플릿 생성"}
            </Button>
          </>
        }
        end={
          <Button
            type="button"
            variant="outline"
            size="default"
            className={DELIVERABLES_PRIMARY_BUTTON_CLASS}
            disabled={
              !canRecordInbound ||
              isRecording ||
              isDownloading ||
              isDownloadingShoplingOutbound
            }
            onClick={handleRecordInboundClick}
          >
            {isRecording ? "기록 중..." : "기록하기"}
          </Button>
        }
      />

      {!hasSeller ? (
        <p className="text-sm text-muted-foreground">
          판매자 계정을 선택해 주세요.
        </p>
      ) : !hasStoredTemplate && !isLoadingTemplateMeta ? (
        <p className="text-sm text-muted-foreground">
          WING 입고 템플릿이 없으면 생성할 수 없습니다.
        </p>
      ) : null}

      {notice ? (
        <p className="text-sm text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

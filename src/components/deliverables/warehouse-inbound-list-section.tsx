"use client";

import { CircleCheck, CircleMinus, CircleX } from "lucide-react";
import { useEffect, useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import {
  DeliverablesActionBar,
  DELIVERABLES_PRIMARY_BUTTON_CLASS,
} from "@/components/deliverables/deliverables-action-bar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WarehouseInboundListSnapshotDates } from "@/services/deliverables/types";

type WarehouseInboundListSectionProps = {
  sellerId: string;
  rowCount: number;
  snapshotDates: WarehouseInboundListSnapshotDates | null;
};

const WAREHOUSE_INBOUND_ROTATION_OPTIONS = [
  { value: "1", label: "1회전" },
  { value: "2", label: "2회전" },
  { value: "3", label: "3회전" },
  { value: "", label: "없음" },
] as const;

const sellerSelectClassName =
  "h-9 min-w-[120px] rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

type StepStatus = "success" | "error" | "skipped";

type DownloadRunResult = {
  download: { status: StepStatus; message: string };
  sheet: { status: StepStatus; message: string; sheetUrl: string | null };
};

const STEP_STATUS_LABEL: Record<StepStatus, string> = {
  success: "완료",
  error: "실패",
  skipped: "미실행",
};

function StepResultRow({
  label,
  status,
  message,
  sheetUrl,
}: {
  label: string;
  status: StepStatus;
  message: string;
  sheetUrl?: string | null;
}) {
  return (
    <li
      className={
        status === "error"
          ? "flex items-start gap-3.5 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
          : "flex items-start gap-3.5 rounded-xl border border-border bg-muted/30 p-4"
      }
    >
      {status === "success" ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/12">
          <CircleCheck
            className="size-5.5 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
        </span>
      ) : status === "error" ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/12">
          <CircleX className="size-5.5 text-destructive" aria-hidden />
        </span>
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <CircleMinus
            className="size-5.5 text-muted-foreground"
            aria-hidden
          />
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.95rem] font-semibold text-foreground">
            {label}
          </p>
          <span
            className={
              status === "success"
                ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
                : status === "error"
                  ? "text-xs font-medium text-destructive"
                  : "text-xs font-medium text-muted-foreground"
            }
          >
            {STEP_STATUS_LABEL[status]}
          </span>
        </div>
        <p
          className={
            status === "error"
              ? "text-sm leading-relaxed break-words text-destructive"
              : "text-sm leading-relaxed break-words text-muted-foreground"
          }
        >
          {message}
        </p>
        {sheetUrl ? (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 pt-0.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            시트 열기 ↗
          </a>
        ) : null}
      </div>
    </li>
  );
}

function formatSnapshotLabel(
  snapshotDates: WarehouseInboundListSnapshotDates | null,
): string {
  if (!snapshotDates) {
    return "-";
  }

  const parts = [
    snapshotDates.template ? `템플릿 ${snapshotDates.template}` : null,
    snapshotDates.shopling ? `샵플링 ${snapshotDates.shopling}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "-";
}

export function WarehouseInboundListSection({
  sellerId,
  rowCount,
  snapshotDates,
}: WarehouseInboundListSectionProps) {
  const [notice, setNotice] = useState<string | null>(null);
  // 어떤 다운로드가 진행 중인지 구분 (둘이 같은 로딩 상태를 공유하지 않도록)
  const [downloadingVariant, setDownloadingVariant] = useState<
    "standard" | "shortage" | null
  >(null);
  const isDownloading = downloadingVariant !== null;
  const [isCopyingToSheet, setIsCopyingToSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [canRecordInbound, setCanRecordInbound] = useState(false);
  const [inboundRotation, setInboundRotation] = useState("1");
  const [runResult, setRunResult] = useState<DownloadRunResult | null>(null);
  const hasSeller = sellerId.trim().length > 0;

  useEffect(() => {
    setCanRecordInbound(false);
  }, [sellerId, inboundRotation]);

  async function handleRecordClick() {
    if (!canRecordInbound || !hasSeller || isRecording || isDownloading || isCopyingToSheet) {
      return;
    }

    setIsRecording(true);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/warehouse-inbound-deliverables?seller=${encodeURIComponent(sellerId)}${
          inboundRotation ? `&rotation=${encodeURIComponent(inboundRotation)}` : ""
        }`,
        { method: "POST" },
      );

      const payload = (await response.json().catch(() => null)) as
        | { ok: true; data: { recordedCount: number } }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !payload || !("ok" in payload) || !payload.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "기록에 실패했습니다.",
        );
      }

      const { recordedCount } = payload.data;

      setNotice(
        recordedCount > 0
          ? `${recordedCount}건을 기록했습니다.`
          : "기록했습니다. 다운로드 가능한 항목이 없어 헤더만 포함된 파일입니다.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "기록에 실패했습니다.",
      );
    } finally {
      setIsRecording(false);
    }
  }

  async function downloadWarehouseInboundExcel(
    shoplingZeroShortageOnly: boolean,
  ): Promise<void> {
    const response = await fetch(
      `/api/downloads/warehouse-inbound-list?seller=${encodeURIComponent(sellerId)}${
        inboundRotation ? `&rotation=${encodeURIComponent(inboundRotation)}` : ""
      }${shoplingZeroShortageOnly ? "&shoplingZeroShortage=1" : ""}`,
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error ?? "다운로드에 실패했습니다.");
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const filename = filenameMatch
      ? decodeURIComponent(filenameMatch[1])
      : "창고전송용_입고리스트.xlsx";

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  async function pushToGoogleSheet(): Promise<{
    sheetUrl: string;
    rowCount: number;
  }> {
    const response = await fetch(
      `/api/downloads/warehouse-inbound-list/google-sheets?seller=${encodeURIComponent(sellerId)}${
        inboundRotation ? `&rotation=${encodeURIComponent(inboundRotation)}` : ""
      }`,
      { method: "POST" },
    );

    const payload = (await response.json().catch(() => null)) as
      | { ok: true; data: { sheetUrl: string; rowCount: number } }
      | { ok: false; error?: string }
      | null;

    if (!response.ok || !payload || !("ok" in payload) || !payload.ok) {
      throw new Error(
        payload && "error" in payload && payload.error
          ? payload.error
          : "Google Sheets 반영에 실패했습니다.",
      );
    }

    return payload.data;
  }

  async function handleDownloadClick(shoplingZeroShortageOnly = false) {
    if (!hasSeller) {
      return;
    }

    setDownloadingVariant(shoplingZeroShortageOnly ? "shortage" : "standard");
    setNotice(null);

    // 샵플링 재고0 누락분은 별개 목록이라 시트반영 없이 다운로드만 한다.
    if (shoplingZeroShortageOnly) {
      try {
        await downloadWarehouseInboundExcel(true);
        setNotice(
          "샵플링 재고0 누락분(입고 필요하나 샵플링 재고 0)을 다운로드했습니다.",
        );
      } catch (error) {
        setNotice(
          error instanceof Error ? error.message : "다운로드에 실패했습니다.",
        );
      } finally {
        setDownloadingVariant(null);
      }
      return;
    }

    // 표준 다운로드: 엑셀 다운로드 → 시트반영을 자동 연속 실행하고 결과 알림창 표시
    const result: DownloadRunResult = {
      download: { status: "error", message: "다운로드에 실패했습니다." },
      sheet: {
        status: "skipped",
        message: "다운로드가 실패해 실행하지 않았습니다.",
        sheetUrl: null,
      },
    };

    try {
      await downloadWarehouseInboundExcel(false);
      result.download = {
        status: "success",
        message:
          rowCount > 0
            ? `${rowCount}건이 포함된 파일을 다운로드했습니다.`
            : "다운로드 가능한 항목이 없어 헤더만 포함된 파일을 다운로드했습니다.",
      };
      setCanRecordInbound(true);
    } catch (error) {
      result.download = {
        status: "error",
        message:
          error instanceof Error ? error.message : "다운로드에 실패했습니다.",
      };
    }

    if (result.download.status === "success") {
      try {
        const pushed = await pushToGoogleSheet();
        result.sheet = {
          status: "success",
          message:
            pushed.rowCount > 0
              ? `시트에 ${pushed.rowCount}건 반영했습니다.`
              : "시트에 헤더만 반영했습니다.",
          sheetUrl: pushed.sheetUrl,
        };
      } catch (error) {
        result.sheet = {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Google Sheets 반영에 실패했습니다.",
          sheetUrl: null,
        };
      }
    }

    setRunResult(result);
    setDownloadingVariant(null);
  }

  async function handleSheetCopyClick() {
    if (!hasSeller) {
      return;
    }

    setIsCopyingToSheet(true);
    setNotice(null);

    try {
      const pushed = await pushToGoogleSheet();

      window.open(pushed.sheetUrl, "_blank", "noopener,noreferrer");

      setNotice(
        pushed.rowCount > 0
          ? `${pushed.rowCount}건을 Google 시트에 복사했습니다.`
          : "Google 시트에 헤더만 복사했습니다.",
      );
      setCanRecordInbound(true);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Google Sheets 복사에 실패했습니다.",
      );
    } finally {
      setIsCopyingToSheet(false);
    }
  }

  return (
    <DeliverablesSection
      title="창고 전송용 입고리스트 생성"
      description="대시보드 입고추천 수량 기준, 샵플링 로케이션·바코드가 반영된 창고 전달용 엑셀입니다."
      variant="plain"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="shrink-0 text-sm font-medium text-foreground">
            입고 회차
          </span>
          <select
            value={inboundRotation}
            onChange={(event) => setInboundRotation(event.target.value)}
            aria-label="입고 회차"
            className={sellerSelectClassName}
          >
            {WAREHOUSE_INBOUND_ROTATION_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        스냅샷 {formatSnapshotLabel(snapshotDates)} · 다운로드 가능{" "}
        {hasSeller ? `${rowCount}건` : "-"}
      </p>

      <DeliverablesActionBar
        center={
          <>
            <Button
              type="button"
              size="default"
              className={DELIVERABLES_PRIMARY_BUTTON_CLASS}
              disabled={
                !hasSeller || isDownloading || isCopyingToSheet || isRecording
              }
              onClick={() => handleDownloadClick(false)}
            >
              {downloadingVariant === "standard" ? "생성 중..." : "다운로드"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              className={DELIVERABLES_PRIMARY_BUTTON_CLASS}
              disabled={
                !hasSeller || isDownloading || isCopyingToSheet || isRecording
              }
              onClick={() => handleDownloadClick(true)}
              title="입고 필요량은 계산되나 샵플링 재고가 0이라 표준 리스트에서 빠진 상품만 다운로드합니다."
            >
              {downloadingVariant === "shortage" ? "생성 중..." : "샵플링 재고0 누락분"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              className={DELIVERABLES_PRIMARY_BUTTON_CLASS}
              disabled={
                !hasSeller || isDownloading || isCopyingToSheet || isRecording
              }
              onClick={handleSheetCopyClick}
            >
              {isCopyingToSheet ? "복사 중..." : "시트 복사"}
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
              !hasSeller ||
              isRecording ||
              isDownloading ||
              isCopyingToSheet
            }
            onClick={handleRecordClick}
          >
            {isRecording ? "기록 중..." : "기록하기"}
          </Button>
        }
      />

      {!hasSeller ? (
        <p className="mt-3 text-sm text-muted-foreground">
          판매자 계정을 선택해 주세요.
        </p>
      ) : null}

      {notice ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}

      <Dialog
        open={runResult !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRunResult(null);
          }
        }}
      >
        <DialogContent className="gap-5 p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">다운로드 결과</DialogTitle>
          </DialogHeader>
          {runResult ? (
            <ul className="space-y-3">
              <StepResultRow
                label="다운로드"
                status={runResult.download.status}
                message={runResult.download.message}
              />
              <StepResultRow
                label="시트반영"
                status={runResult.sheet.status}
                message={runResult.sheet.message}
                sheetUrl={runResult.sheet.sheetUrl}
              />
            </ul>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              size="default"
              className="min-w-[7rem]"
              onClick={() => setRunResult(null)}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DeliverablesSection>
  );
}

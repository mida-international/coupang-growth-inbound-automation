"use client";

import { useEffect, useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import {
  DeliverablesActionBar,
  DELIVERABLES_PRIMARY_BUTTON_CLASS,
} from "@/components/deliverables/deliverables-action-bar";
import { Button } from "@/components/ui/button";
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopyingToSheet, setIsCopyingToSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [canRecordInbound, setCanRecordInbound] = useState(false);
  const [inboundRotation, setInboundRotation] = useState("1");
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

  async function handleDownloadClick() {
    if (!hasSeller) {
      return;
    }

    setIsDownloading(true);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/downloads/warehouse-inbound-list?seller=${encodeURIComponent(sellerId)}${
          inboundRotation ? `&rotation=${encodeURIComponent(inboundRotation)}` : ""
        }`,
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

      setNotice(
        rowCount > 0
          ? `${rowCount}건이 포함된 파일을 다운로드했습니다.`
          : "다운로드 가능한 항목이 없어 헤더만 포함된 파일을 다운로드했습니다.",
      );
      setCanRecordInbound(true);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "다운로드에 실패했습니다.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleSheetCopyClick() {
    if (!hasSeller) {
      return;
    }

    setIsCopyingToSheet(true);
    setNotice(null);

    try {
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
            : "Google Sheets 복사에 실패했습니다.",
        );
      }

      window.open(payload.data.sheetUrl, "_blank", "noopener,noreferrer");

      setNotice(
        payload.data.rowCount > 0
          ? `${payload.data.rowCount}건을 Google 시트에 복사했습니다.`
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
    </DeliverablesSection>
  );
}

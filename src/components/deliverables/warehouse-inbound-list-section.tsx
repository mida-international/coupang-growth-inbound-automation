"use client";

import { useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { Button } from "@/components/ui/button";
import type { WarehouseInboundListSnapshotDates } from "@/services/deliverables/types";

type WarehouseInboundListSectionProps = {
  sellerId: string;
  rowCount: number;
  snapshotDates: WarehouseInboundListSnapshotDates | null;
};

const WAREHOUSE_INBOUND_ROTATION_OPTIONS = [
  { value: "", label: "없음" },
  { value: "1", label: "1회전" },
  { value: "2", label: "2회전" },
  { value: "3", label: "3회전" },
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
  const [isRecording, setIsRecording] = useState(false);
  const [inboundRotation, setInboundRotation] = useState("");
  const hasSeller = sellerId.trim().length > 0;

  async function handleRecordClick() {
    if (!hasSeller) {
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

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "기록에 실패했습니다.");
      }

      const recordedCountHeader = response.headers.get("X-Recorded-Count");
      const recordedCount = recordedCountHeader
        ? Number(recordedCountHeader)
        : rowCount;

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
        recordedCount > 0
          ? `${recordedCount}건을 기록하고 파일을 다운로드했습니다.`
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
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "다운로드에 실패했습니다.",
      );
    } finally {
      setIsDownloading(false);
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          스냅샷 {formatSnapshotLabel(snapshotDates)} · 다운로드 가능{" "}
          {hasSeller ? `${rowCount}건` : "-"}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasSeller || isRecording || isDownloading}
            onClick={handleRecordClick}
          >
            {isRecording ? "기록 중..." : "기록하기"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!hasSeller || isDownloading || isRecording}
            onClick={handleDownloadClick}
          >
            {isDownloading ? "생성 중..." : "다운로드"}
          </Button>
        </div>
      </div>

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

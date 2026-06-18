"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { ListExcelDownloadButton } from "@/components/data-list/list-excel-download-button";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiDelete } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type {
  CoupangInboundDeliverableListItem,
  ListCoupangInboundDeliverablesResult,
} from "@/services/deliverables/types";

type CoupangInboundRecordHistorySectionProps = {
  data: ListCoupangInboundDeliverablesResult;
};

function formatCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "-";
  }

  return value;
}

function formatRecordedAt(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function buildHistoryPageHref(page: number, pageSize: number): string {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (pageSize !== 20) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();

  return query.length > 0
    ? `/data/dashboard/coupang-inbound?${query}`
    : "/data/dashboard/coupang-inbound";
}

function HistoryRow({
  row,
  onDeleted,
}: {
  row: CoupangInboundDeliverableListItem;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/coupang-inbound-deliverables/${row.id}/download`,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "엑셀 다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : row.outputFileName;

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "엑셀 다운로드에 실패했습니다.",
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `"${row.outputFileName}" 입고리스트 기록과 저장된 엑셀을 삭제할까요?\n추세관리(쿠팡 입고)와 작업대 회전 수치에서도 제외됩니다.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    const result = await apiDelete<void>(
      `/api/coupang-inbound-deliverables/${row.id}`,
    );

    setDeleting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onDeleted();
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 text-left text-sm font-medium",
              "hover:text-foreground",
            )}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform",
                open ? "rotate-180" : "",
              )}
            />
            {formatRecordedAt(row.recordedAt)}
          </button>
        </TableCell>
        <TableCell>{row.outputFileName}</TableCell>
        <TableCell>{formatCell(row.sellerDisplayName)}</TableCell>
        <TableCell>{formatCell(row.sourceFileName)}</TableCell>
        <TableCell>{formatCell(row.recordedByName)}</TableCell>
        <TableCell className="text-right">
          {row.matchedCount.toLocaleString()}
        </TableCell>
        <TableCell className="text-right">
          {row.unmatchedCount.toLocaleString()}
        </TableCell>
        <TableCell className="text-right">
          {row.itemCount.toLocaleString()}
        </TableCell>
        <TableCell className="text-right">
          {row.totalQuantity.toLocaleString()}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={downloading || deleting}
              onClick={handleDownload}
            >
              {downloading ? "다운로드 중..." : "다운로드"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={downloading || deleting}
              onClick={handleDelete}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={10} className="p-0">
            <div className="border-t border-border px-4 py-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                저장된 입고 바코드별 수량
              </p>
              {row.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  저장된 행이 없습니다.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border bg-background">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>바코드</TableHead>
                        <TableHead>옵션 ID</TableHead>
                        <TableHead className="text-right">수량</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {row.items.map((item, index) => (
                        <TableRow
                          key={`${row.id}-${item.productBarcode}-${index}`}
                        >
                          <TableCell>{item.productBarcode}</TableCell>
                          <TableCell>
                            {formatCell(item.coupangOptionId)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function CoupangInboundRecordHistorySection({
  data,
}: CoupangInboundRecordHistorySectionProps) {
  const router = useRouter();
  const hasPrev = data.page > 1;
  const hasNext = data.page < data.totalPages;
  const [exportError, setExportError] = useState<string | null>(null);

  return (
    <DeliverablesSection
      title="쿠팡그로스 입고리스트 기록 목록"
      description="기록하기로 저장된 WING 입고 템플릿 엑셀과 바코드별 수량을 조회합니다."
      variant="plain"
    >
      {data.rowCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          저장된 입고리스트 기록이 없습니다.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              총 {data.rowCount.toLocaleString()}건
            </p>
            <div className="flex flex-col items-end gap-2">
              {exportError ? (
                <p className="text-sm text-destructive" role="alert">
                  {exportError}
                </p>
              ) : null}
              <ListExcelDownloadButton
                downloadHref="/api/downloads/coupang-inbound-history"
                onError={setExportError}
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>기록일시</TableHead>
                    <TableHead>산출물 파일명</TableHead>
                    <TableHead>판매자</TableHead>
                    <TableHead>원본 박스리스트</TableHead>
                    <TableHead>기록자</TableHead>
                    <TableHead className="text-right">매칭</TableHead>
                    <TableHead className="text-right">미매칭</TableHead>
                    <TableHead className="text-right">행 수</TableHead>
                    <TableHead className="text-right">수량 합</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row) => (
                    <HistoryRow
                      key={row.id}
                      row={row}
                      onDeleted={() => router.refresh()}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              총 {data.rowCount.toLocaleString()}건 · {data.page}/{data.totalPages}{" "}
              페이지
            </p>
            <div className="flex gap-2">
              {hasPrev ? (
                <Link
                  href={buildHistoryPageHref(data.page - 1, data.pageSize)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  이전
                </Link>
              ) : (
                <Button type="button" variant="outline" size="sm" disabled>
                  이전
                </Button>
              )}
              {hasNext ? (
                <Link
                  href={buildHistoryPageHref(data.page + 1, data.pageSize)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  다음
                </Link>
              ) : (
                <Button type="button" variant="outline" size="sm" disabled>
                  다음
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </DeliverablesSection>
  );
}

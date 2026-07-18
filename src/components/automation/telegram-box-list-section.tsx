"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { TelegramCoupangTemplatePanel } from "@/components/automation/telegram-coupang-template-panel";
import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiDelete } from "@/lib/api-client";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

const DEFAULT_CAPTION_KEYWORD = "#박스";

type TelegramBoxListUploadItem = {
  id: string;
  outputFileName: string;
  rowCount: number;
  imageCount: number;
  status: "processing" | "completed" | "failed";
  errorMessage: string | null;
  telegramUserName: string | null;
  telegramCaption: string | null;
  createdAt: string;
  completedAt: string | null;
};

function formatUploadDate(iso: string | null): string {
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

function statusLabel(status: TelegramBoxListUploadItem["status"]): string {
  switch (status) {
    case "processing":
      return "처리 중";
    case "completed":
      return "완료";
    case "failed":
      return "실패";
  }
}

function UploadRow({
  upload,
  accounts,
  onDeleted,
}: {
  upload: TelegramBoxListUploadItem;
  accounts: SellerAccountView[];
  onDeleted: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);

  async function handleDownload() {
    if (upload.status !== "completed") {
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/telegram/box-list-uploads/${encodeURIComponent(upload.id)}/download`,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "엑셀 다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = upload.outputFileName;
      anchor.click();
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
    if (
      !window.confirm(
        `"${upload.outputFileName}" 기록과 저장된 엑셀 파일을 삭제할까요?`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await apiDelete(
        `/api/telegram/box-list-uploads/${encodeURIComponent(upload.id)}`,
      );

      if (!response.ok) {
        throw new Error(response.error ?? "삭제에 실패했습니다.");
      }

      onDeleted();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "삭제에 실패했습니다.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <TableRow>
        <TableCell>{formatUploadDate(upload.createdAt)}</TableCell>
        <TableCell>{statusLabel(upload.status)}</TableCell>
        <TableCell>
          {upload.status === "completed" ? `${upload.rowCount}행` : "-"}
        </TableCell>
        <TableCell className="max-w-[12rem] truncate">
          {upload.telegramUserName ? `@${upload.telegramUserName}` : "-"}
        </TableCell>
        <TableCell className="max-w-[14rem] truncate">
          {upload.telegramCaption ?? "-"}
        </TableCell>
        <TableCell className="max-w-[12rem] truncate">
          {upload.outputFileName}
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={upload.status !== "completed" || downloading}
              onClick={() => void handleDownload()}
            >
              {downloading ? "다운로드 중..." : "다운로드"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={upload.status !== "completed"}
              onClick={() => setTemplateOpen((open) => !open)}
            >
              쿠팡 템플릿
              {templateOpen ? (
                <ChevronUp className="size-3.5" aria-hidden />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {templateOpen && upload.status === "completed" ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="p-3">
            <TelegramCoupangTemplatePanel
              uploadId={upload.id}
              outputFileName={upload.outputFileName}
              accounts={accounts}
            />
          </TableCell>
        </TableRow>
      ) : null}
      {error || upload.errorMessage ? (
        <TableRow>
          <TableCell colSpan={7} className="text-xs text-destructive">
            {error ?? upload.errorMessage}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function TelegramBoxListSection({
  accounts,
}: {
  accounts: SellerAccountView[];
}) {
  const [uploads, setUploads] = useState<TelegramBoxListUploadItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadUploads = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);

    try {
      const response = await fetch("/api/telegram/box-list-uploads?limit=50");
      const payload = (await response.json().catch(() => null)) as
        | { ok: true; data: { uploads: TelegramBoxListUploadItem[] } }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !payload || !payload.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "업로드 목록을 불러오지 못했습니다.",
        );
      }

      setUploads(payload.data.uploads);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "업로드 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUploads();
  }, [loadUploads]);

  return (
    <DeliverablesSection
      title="텔레그램 OCR"
      description="텔레그램 그룹에 박스 사진을 올리면 OCR 후 엑셀로 저장됩니다."
      variant="plain"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">사용 방법</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              HEERAH 그룹에 박스 사진을 업로드합니다.
            </li>
            <li>
              사진 캡션(주석)에{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                {DEFAULT_CAPTION_KEYWORD}
              </code>
              를 반드시 포함합니다. (예:{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                {DEFAULT_CAPTION_KEYWORD} 1번
              </code>
              )
            </li>
            <li>
              OCR 완료 후 아래 목록에서 엑셀을 다운로드합니다.
            </li>
            <li>
              완료된 행에서 <span className="font-medium text-foreground">쿠팡 템플릿</span>을 누르고
              판매자 계정을 선택하면 쿠팡그로스 입고 템플릿을 바로 생성할 수
              있습니다.
            </li>
          </ol>
          <p className="mt-2 text-xs">
            캡션 없이 올린 사진은 처리되지 않으며, 봇이 캡션 입력 방법을
            안내합니다.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            변환된 엑셀 목록
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void loadUploads()}
          >
            {isLoading ? "새로고침 중..." : "새로고침"}
          </Button>
        </div>

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>업로드 시각</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>행 수</TableHead>
                <TableHead>발신자</TableHead>
                <TableHead>캡션</TableHead>
                <TableHead>파일명</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploads.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {isLoading
                      ? "목록을 불러오는 중..."
                      : "저장된 엑셀이 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                uploads.map((upload) => (
                  <UploadRow
                    key={upload.id}
                    upload={upload}
                    accounts={accounts}
                    onDeleted={() => void loadUploads()}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {notice ? (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        ) : null}
      </div>
    </DeliverablesSection>
  );
}

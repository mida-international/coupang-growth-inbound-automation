"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { downloadListExcel } from "@/lib/excel/download-list-excel";

type ListExcelDownloadButtonProps = {
  downloadHref: string;
  disabled?: boolean;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  className?: string;
  onError?: (message: string) => void;
  onSuccess?: () => void;
};

export function ListExcelDownloadButton({
  downloadHref,
  disabled = false,
  label = "엑셀 다운로드",
  size = "sm",
  variant = "outline",
  className,
  onError,
  onSuccess,
}: ListExcelDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleClick() {
    setDownloading(true);

    try {
      await downloadListExcel(downloadHref);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "엑셀 다운로드에 실패했습니다.";
      onError?.(message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || downloading}
      onClick={handleClick}
    >
      {downloading ? "다운로드 중..." : label}
    </Button>
  );
}

"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import { FILE_INPUT_ACCEPT } from "@/lib/excel/validate-file";
import { cn } from "@/lib/utils";

type ExcelDropzoneProps = {
  description?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
  className?: string;
};

export function ExcelDropzone({
  description = "파일을 드래그하거나 클릭하여 선택",
  multiple = true,
  disabled = false,
  onFilesSelected,
  className,
}: ExcelDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (disabled || !fileList?.length) {
      return;
    }

    onFilesSelected(Array.from(fileList));
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled) {
            fileInputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors",
          disabled
            ? "cursor-not-allowed border-border bg-muted/30 opacity-50"
            : "cursor-pointer",
          !disabled &&
            (isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:border-primary/50 hover:bg-muted/30"),
          className,
        )}
      >
        <Upload className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">지원 형식: .xlsx, .xls</p>
      </div>
    </>
  );
}

"use client";

import { ImageIcon, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { VisionExtractPreviewTable } from "@/components/deliverables/vision/vision-extract-preview-table";
import type { VisionExtractedData } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

type CoupangInboundImageDropzoneProps = {
  disabled?: boolean;
  imageFiles: File[];
  onImageFilesChange: (files: File[]) => void;
  visionData?: VisionExtractedData | null;
};

export function CoupangInboundImageDropzone({
  disabled = false,
  imageFiles,
  onImageFilesChange,
  visionData = null,
}: CoupangInboundImageDropzoneProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imageFiles]);

  function handleImageFiles(fileList: FileList | null) {
    if (disabled || !fileList?.length) {
      return;
    }

    const files = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length === 0) {
      return;
    }

    onImageFilesChange(files);
  }

  return (
    <div className="space-y-3">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          handleImageFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled) {
            imageInputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            imageInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
        }}
        onDrop={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          handleImageFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors",
          disabled
            ? "cursor-not-allowed border-border bg-muted/30 opacity-50"
            : "cursor-pointer border-border bg-background hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        {imageFiles.length > 0 ? (
          <ImageIcon className="size-8 text-muted-foreground" aria-hidden />
        ) : (
          <Upload className="size-8 text-muted-foreground" aria-hidden />
        )}
        <p className="text-sm font-medium text-foreground">
          {imageFiles.length > 0
            ? `${imageFiles.length}장 선택됨`
            : "사진 또는 스캔본을 드래그하거나 클릭하여 선택"}
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WEBP · 최대 5장 · 박스리스트 표가 선명하게 보이도록 촬영
        </p>
      </div>

      {previewUrls.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {previewUrls.map((url, index) => (
            <div
              key={url}
              className="overflow-hidden rounded-md border border-border bg-muted/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`입고 리스트 미리보기 ${index + 1}`}
                className="h-24 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      ) : null}

      {visionData ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">인식 결과 미리보기</p>
          <VisionExtractPreviewTable visionData={visionData} />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { ImageIcon, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { ExcelDropzone } from "@/components/excel/excel-dropzone";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadShoplingOutboundTemplate } from "@/lib/deliverables/client/download-shopling-outbound-template";
import { cn } from "@/lib/utils";

type ShoplingOutboundTemplateSectionProps = {
  sellerId: string;
};

type InputTab = "excel" | "image";

export function ShoplingOutboundTemplateSection({
  sellerId,
}: ShoplingOutboundTemplateSectionProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<InputTab>("excel");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const hasSeller = sellerId.trim().length > 0;
  const canDownloadExcel =
    hasSeller && excelFile !== null && !isDownloading;
  const downloadDisabled =
    activeTab === "excel"
      ? !canDownloadExcel
      : !hasSeller || isDownloading;

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  function handleImageFiles(fileList: FileList | null) {
    if (!hasSeller || !fileList?.length) {
      return;
    }

    const file = fileList[0];

    if (!file.type.startsWith("image/")) {
      return;
    }

    setImageFile(file);
    setNotice(null);
  }

  async function handleDownloadClick() {
    if (!hasSeller) {
      return;
    }

    if (activeTab === "image") {
      setNotice("준비 중입니다. 이미지 OCR 연동은 곧 제공됩니다.");
      return;
    }

    if (!canDownloadExcel || !excelFile) {
      return;
    }

    setIsDownloading(true);
    setNotice(null);

    try {
      const noticeMessage = await downloadShoplingOutboundTemplate(
        sellerId,
        excelFile,
      );
      setNotice(noticeMessage);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "샵플링 출고 템플릿 생성에 실패했습니다.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <DeliverablesSection
      title="샵플링 출고 템플릿 생성"
      description="출고 대상 리스트(엑셀 또는 이미지)를 업로드한 뒤, 샵플링 출고 템플릿 형식의 엑셀을 생성합니다."
      variant="plain"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-muted/20 p-4">
          <p className="mb-3 text-sm font-medium text-foreground">
            출고 리스트 업로드
          </p>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as InputTab)}
          >
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="excel" className="flex-1">
                엑셀 파일 업로드
              </TabsTrigger>
              <TabsTrigger value="image" className="flex-1">
                이미지 업로드
              </TabsTrigger>
            </TabsList>

            <TabsContent value="excel" className="space-y-2">
              <ExcelDropzone
                multiple={false}
                disabled={!hasSeller}
                description={
                  excelFile
                    ? excelFile.name
                    : "엑셀 파일을 드래그하거나 클릭하여 선택"
                }
                onFilesSelected={(files) => {
                  setExcelFile(files[0] ?? null);
                  setNotice(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                필수 컬럼: 바코드, 수량 (로케이션·옵션명은 선택)
              </p>
            </TabsContent>

            <TabsContent value="image" className="space-y-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                disabled={!hasSeller}
                className="sr-only"
                onChange={(event) => {
                  handleImageFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              <div
                role="button"
                tabIndex={hasSeller ? 0 : -1}
                aria-disabled={!hasSeller}
                onClick={() => {
                  if (hasSeller) {
                    imageInputRef.current?.click();
                  }
                }}
                onKeyDown={(event) => {
                  if (!hasSeller) {
                    return;
                  }

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    imageInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  if (!hasSeller) {
                    return;
                  }

                  event.preventDefault();
                  setIsImageDragging(true);
                }}
                onDragLeave={(event) => {
                  if (!hasSeller) {
                    return;
                  }

                  event.preventDefault();
                  setIsImageDragging(false);
                }}
                onDrop={(event) => {
                  if (!hasSeller) {
                    return;
                  }

                  event.preventDefault();
                  setIsImageDragging(false);
                  handleImageFiles(event.dataTransfer.files);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors",
                  !hasSeller
                    ? "cursor-not-allowed border-border bg-muted/30 opacity-50"
                    : "cursor-pointer",
                  hasSeller &&
                    (isImageDragging
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/50 hover:bg-muted/30"),
                )}
              >
                {imageFile ? (
                  <ImageIcon
                    className="size-8 text-muted-foreground"
                    aria-hidden
                  />
                ) : (
                  <Upload className="size-8 text-muted-foreground" aria-hidden />
                )}
                <p className="text-sm font-medium text-foreground">
                  {imageFile
                    ? imageFile.name
                    : "사진 또는 스캔본을 드래그하거나 클릭하여 선택"}
                </p>
                <p className="text-xs text-muted-foreground">
                  지원 형식: JPG, PNG, WEBP 등 이미지 파일
                </p>
              </div>

              {imagePreviewUrl ? (
                <div className="overflow-hidden rounded-md border border-border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreviewUrl}
                    alt="출고 리스트 이미지 미리보기"
                    className="mx-auto max-h-40 object-contain"
                  />
                </div>
              ) : null}

              <p className="text-xs text-muted-foreground">
                종이 출고 리스트 사진 OCR 예정 (기능 연동 전)
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            size="sm"
            disabled={downloadDisabled}
            onClick={handleDownloadClick}
          >
            {isDownloading ? "생성 중..." : "다운로드"}
          </Button>
        </div>

        {!hasSeller ? (
          <p className="text-sm text-muted-foreground">
            판매자 계정을 선택해 주세요.
          </p>
        ) : hasSeller && activeTab === "excel" && !excelFile ? (
          <p className="text-sm text-muted-foreground">
            출고 리스트 엑셀 파일을 선택해 주세요.
          </p>
        ) : hasSeller && activeTab === "image" && !imageFile ? (
          <p className="text-sm text-muted-foreground">
            출고 리스트 이미지를 선택해 주세요.
          </p>
        ) : null}

        {notice ? (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        ) : null}
      </div>
    </DeliverablesSection>
  );
}

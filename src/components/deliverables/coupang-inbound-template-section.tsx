"use client";

import { ImageIcon, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { ExcelDropzone } from "@/components/excel/excel-dropzone";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type CoupangInboundTemplateSectionProps = {
  sellerId: string;
};

type InputTab = "excel" | "image";

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

export function CoupangInboundTemplateSection({
  sellerId,
}: CoupangInboundTemplateSectionProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<InputTab>("excel");
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null);
  const [isLoadingTemplateMeta, setIsLoadingTemplateMeta] = useState(false);
  const [canRecordInbound, setCanRecordInbound] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const hasSeller = sellerId.trim().length > 0;
  const hasStoredTemplate = templateMeta?.exists === true;
  const canDownloadExcel =
    hasSeller && hasStoredTemplate && excelFile !== null && !isDownloading;
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

  useEffect(() => {
    setCanRecordInbound(false);
  }, [sellerId, excelFile, activeTab]);

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
      const formData = new FormData();
      formData.append("seller", sellerId);
      formData.append("boxListFile", excelFile);

      const response = await fetch("/api/downloads/coupang-inbound-template", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "입고 템플릿 생성에 실패했습니다.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : "쿠팡_입고템플릿_생성.xlsx";

      const matched = response.headers.get("X-Filter-Matched");
      const unmatched = response.headers.get("X-Filter-Unmatched");

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(objectUrl);

      const statsParts = [
        matched !== null ? `매칭 ${matched}건` : null,
        unmatched !== null ? `미매칭 ${unmatched}건` : null,
      ].filter(Boolean);

      setNotice(
        statsParts.length > 0
          ? `${statsParts.join(", ")} — 파일을 다운로드했습니다.`
          : "입고 템플릿 파일을 다운로드했습니다.",
      );
      setCanRecordInbound(true);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "입고 템플릿 생성에 실패했습니다.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleRecordInboundClick() {
    if (!canRecordInbound || !excelFile || !hasSeller) {
      return;
    }

    setIsRecording(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("seller", sellerId);
      formData.append("boxListFile", excelFile);

      const response = await fetch("/api/inbound-records", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok: true; data: { recordedCount: number } }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !payload || !("ok" in payload) || !payload.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "입고 기록에 실패했습니다.",
        );
      }

      setNotice(
        `${payload.data.recordedCount}개 바코드 입고를 기록했습니다.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "입고 기록에 실패했습니다.",
      );
    } finally {
      setIsRecording(false);
    }
  }

  return (
    <DeliverablesSection
      title="쿠팡그로스 입고 템플릿 생성"
      description="박스 단위 입고 리스트(엑셀 또는 이미지)를 업로드한 뒤, 쿠팡 WING 입고 템플릿에 수량을 반영해 생성합니다."
      variant="plain"
    >
      <div className="space-y-4">
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

        <div className="rounded-md border border-border bg-muted/20 p-4">
          <p className="mb-3 text-sm font-medium text-foreground">
            입고 리스트 업로드
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
                필수 컬럼: 바코드, 수량 (등록상품명·옵션명은 선택)
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
                    alt="입고 리스트 이미지 미리보기"
                    className="mx-auto max-h-40 object-contain"
                  />
                </div>
              ) : null}

              <p className="text-xs text-muted-foreground">
                종이 입고 리스트 사진을 AI가 자동 인식합니다 (기능 연동 예정)
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canRecordInbound || isRecording || isDownloading}
            onClick={handleRecordInboundClick}
          >
            {isRecording ? "기록 중..." : "입고 기록하기"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={downloadDisabled || isRecording}
            onClick={handleDownloadClick}
          >
            {isDownloading ? "생성 중..." : "다운로드"}
          </Button>
        </div>

        {!hasSeller ? (
          <p className="text-sm text-muted-foreground">
            판매자 계정을 선택해 주세요.
          </p>
        ) : hasSeller && !hasStoredTemplate && !isLoadingTemplateMeta ? (
          <p className="text-sm text-muted-foreground">
            WING 입고 템플릿이 없으면 생성할 수 없습니다.
          </p>
        ) : hasSeller &&
          hasStoredTemplate &&
          activeTab === "excel" &&
          !excelFile ? (
          <p className="text-sm text-muted-foreground">
            박스 입고 리스트 엑셀 파일을 선택해 주세요.
          </p>
        ) : hasSeller && activeTab === "image" && !imageFile ? (
          <p className="text-sm text-muted-foreground">
            입고 리스트 이미지를 선택해 주세요.
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

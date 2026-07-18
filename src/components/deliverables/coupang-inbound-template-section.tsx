"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CoupangInboundImageDropzone } from "@/components/deliverables/vision/coupang-inbound-image-dropzone";
import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import {
  DeliverablesActionBar,
  DELIVERABLES_PRIMARY_BUTTON_CLASS,
} from "@/components/deliverables/deliverables-action-bar";
import { ExcelDropzone } from "@/components/excel/excel-dropzone";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadCoupangInboundTemplate } from "@/lib/deliverables/client/download-coupang-inbound-template";
import { downloadShoplingOutboundTemplate } from "@/lib/deliverables/client/download-shopling-outbound-template";
import { recordCoupangInbound } from "@/lib/deliverables/client/record-coupang-inbound";
import {
  buildBoxListExcelFile,
  extractVisionDataFromImages,
} from "@/lib/vision/client/vision-box-list-client";
import type { VisionExtractedData } from "@/lib/vision/types";

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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [visionData, setVisionData] = useState<VisionExtractedData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingShoplingOutbound, setIsDownloadingShoplingOutbound] =
    useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<InputTab>("excel");
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null);
  const [isLoadingTemplateMeta, setIsLoadingTemplateMeta] = useState(false);
  const [canRecordInbound, setCanRecordInbound] = useState(false);
  const hasSeller = sellerId.trim().length > 0;
  const hasStoredTemplate = templateMeta?.exists === true;
  const hasBoxListInput =
    activeTab === "excel" ? excelFile !== null : imageFiles.length > 0;
  const canDownload =
    hasSeller && hasStoredTemplate && hasBoxListInput && !isDownloading;
  const canDownloadShoplingOutbound =
    hasSeller && hasBoxListInput && !isDownloadingShoplingOutbound;

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
  }, [sellerId, excelFile, imageFiles, activeTab]);

  useEffect(() => {
    setVisionData(null);
  }, [sellerId, imageFiles]);

  async function resolveVisionData(): Promise<VisionExtractedData> {
    if (visionData) {
      return visionData;
    }

    const extracted = await extractVisionDataFromImages(imageFiles);
    setVisionData(extracted.visionData);
    return extracted.visionData;
  }

  // 이미지 탭은 OCR 결과를 엑셀로 변환한 뒤, 엑셀 업로드와 동일한 경로로 보낸다.
  async function resolveBoxListFile(): Promise<File | null> {
    if (activeTab === "excel") {
      return excelFile;
    }

    const data = visionData ?? (await resolveVisionData());
    return buildBoxListExcelFile(data, "쿠팡_입고리스트_이미지변환.xlsx");
  }

  async function handleDownloadClick() {
    if (!canDownload) {
      return;
    }

    setIsDownloading(true);
    setNotice(null);

    try {
      const boxListFile = await resolveBoxListFile();

      if (!boxListFile) {
        return;
      }

      const noticeMessage = await downloadCoupangInboundTemplate(
        sellerId,
        boxListFile,
      );
      setNotice(noticeMessage);
      setCanRecordInbound(true);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "입고 템플릿 생성에 실패했습니다.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleShoplingOutboundClick() {
    if (!canDownloadShoplingOutbound) {
      return;
    }

    setIsDownloadingShoplingOutbound(true);
    setNotice(null);

    try {
      let boxListFile: File;

      if (activeTab === "excel") {
        if (!excelFile) {
          return;
        }

        boxListFile = excelFile;
      } else {
        const data = await resolveVisionData();
        boxListFile = buildBoxListExcelFile(data);
      }

      const noticeMessage = await downloadShoplingOutboundTemplate(
        sellerId,
        boxListFile,
      );
      setNotice(noticeMessage);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "샵플링 출고 템플릿 생성에 실패했습니다.",
      );
    } finally {
      setIsDownloadingShoplingOutbound(false);
    }
  }

  async function handleRecordInboundClick() {
    if (!canRecordInbound || !hasSeller) {
      return;
    }

    setIsRecording(true);
    setNotice(null);

    try {
      const boxListFile = await resolveBoxListFile();

      if (!boxListFile) {
        return;
      }

      const recordedCount = await recordCoupangInbound(sellerId, boxListFile);
      setNotice(`${recordedCount}개 바코드 입고를 기록했습니다.`);
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

            <TabsContent value="image">
              <CoupangInboundImageDropzone
                disabled={!hasSeller}
                imageFiles={imageFiles}
                onImageFilesChange={(files) => {
                  setImageFiles(files);
                  setNotice(null);
                }}
                visionData={visionData}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DeliverablesActionBar
          center={
            <>
              <Button
                type="button"
                size="default"
                className={DELIVERABLES_PRIMARY_BUTTON_CLASS}
                disabled={
                  !canDownload ||
                  isRecording ||
                  isDownloadingShoplingOutbound
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
                  !canDownloadShoplingOutbound ||
                  isDownloading ||
                  isRecording
                }
                onClick={handleShoplingOutboundClick}
              >
                {isDownloadingShoplingOutbound
                  ? "생성 중..."
                  : "샵플링 출고 템플릿 생성"}
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
                isRecording ||
                isDownloading ||
                isDownloadingShoplingOutbound
              }
              onClick={handleRecordInboundClick}
            >
              {isRecording ? "기록 중..." : "기록하기"}
            </Button>
          }
        />

        {!hasSeller ? (
          <p className="text-sm text-muted-foreground">
            판매자 계정을 선택해 주세요.
          </p>
        ) : hasSeller && !hasStoredTemplate && !isLoadingTemplateMeta ? (
          <p className="text-sm text-muted-foreground">
            WING 입고 템플릿이 없으면 생성할 수 없습니다.
          </p>
        ) : hasSeller && hasStoredTemplate && activeTab === "excel" && !excelFile ? (
          <p className="text-sm text-muted-foreground">
            박스 입고 리스트 엑셀 파일을 선택해 주세요.
          </p>
        ) : hasSeller && activeTab === "image" && imageFiles.length === 0 ? (
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

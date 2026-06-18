"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ExcelDropzone } from "@/components/excel/excel-dropzone";
import { ExcelFileList } from "@/components/excel/excel-file-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { readCenterSeparationUpsertResponse } from "@/lib/center-separation/parse-upsert-response";
import { CENTER_SEPARATION_TEMPLATE_FILENAME } from "@/lib/excel/generators/center-separation-template";
import { isExcelFile } from "@/lib/excel/validate-file";
import { cn } from "@/lib/utils";
import {
  CENTER_SEPARATION_MISSING_BARCODE_ERROR,
} from "@/services/center-separation/types";
import type { UpsertCenterSeparationResult } from "@/services/center-separation/types";

function summarizeUpsert(
  stats: UpsertCenterSeparationResult["stats"],
  missingBarcodes: string[],
): string {
  const parts = [
    `${stats.upserted.toLocaleString()}건 반영`,
    `신규 ${stats.created.toLocaleString()}건`,
    `갱신 ${stats.updated.toLocaleString()}건`,
  ];

  if (stats.skippedEmptyBarcode > 0) {
    parts.push(`바코드 없음 ${stats.skippedEmptyBarcode.toLocaleString()}행 스킵`);
  }

  if (missingBarcodes.length > 0) {
    parts.push(`대시보드 없음 ${missingBarcodes.length.toLocaleString()}건`);
  }

  if (stats.errors.length > 0) {
    parts.push(`오류 ${stats.errors.length.toLocaleString()}건`);
  }

  return parts.join(" · ");
}

function AddCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-background p-4 sm:p-5",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function MissingBarcodesList({ barcodes }: { barcodes: string[] }) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
      <ul className="space-y-1 font-mono text-sm">
        {barcodes.map((barcode) => (
          <li key={barcode}>{barcode}</li>
        ))}
      </ul>
    </div>
  );
}

export function CenterSeparationAddSection() {
  const router = useRouter();

  const [barcode, setBarcode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [singleMissingDialogOpen, setSingleMissingDialogOpen] = useState(false);
  const [missingBarcodesDialog, setMissingBarcodesDialog] = useState<
    string[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isBusy = isAdding || isUploading || isDownloading;
  const canAdd = barcode.trim().length > 0 && !isBusy;
  const canConfirmUpload = file !== null && !isUploading;

  function resetUploadDialog() {
    setUploadDialogOpen(false);
    setFile(null);
    setDialogError(null);
  }

  function handleFilesSelected(files: File[]) {
    setDialogError(null);

    const nextFile = files[0];

    if (!nextFile) {
      return;
    }

    if (!isExcelFile(nextFile)) {
      setFile(null);
      setDialogError("엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.");
      return;
    }

    setFile(nextFile);
  }

  async function handleAddBarcode() {
    if (!canAdd) {
      return;
    }

    setIsAdding(true);
    setError(null);
    setNotice(null);

    let response: Response;

    try {
      response = await fetch("/api/coupang-growth/center-separation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: barcode.trim() }),
        credentials: "same-origin",
      });
    } catch {
      setIsAdding(false);
      setError("요청 처리에 실패했습니다.");
      return;
    }

    const result = await readCenterSeparationUpsertResponse(response);
    setIsAdding(false);

    if (!result.ok) {
      if (
        result.error === CENTER_SEPARATION_MISSING_BARCODE_ERROR ||
        result.missingBarcodes.length > 0
      ) {
        setSingleMissingDialogOpen(true);
        return;
      }

      setError(result.error);
      return;
    }

    setBarcode("");
    setNotice(
      summarizeUpsert(result.data.stats, result.data.missingBarcodes),
    );
    router.refresh();
  }

  async function handleDownloadTemplate() {
    if (isBusy) {
      return;
    }

    setIsDownloading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/downloads/center-separation-template");

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(
          payload?.error ?? "엑셀 템플릿 다운로드에 실패했습니다.",
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = CENTER_SEPARATION_TEMPLATE_FILENAME;
      anchor.click();
      URL.revokeObjectURL(url);

      setNotice("엑셀 템플릿을 다운로드했습니다.");
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "엑셀 템플릿 다운로드에 실패했습니다.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleConfirmUpload() {
    if (!canConfirmUpload || !file) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setNotice(null);
    setDialogError(null);

    const formData = new FormData();
    formData.append("file", file);

    let response: Response;

    try {
      response = await fetch(
        "/api/coupang-growth/center-separation/excel-upload",
        {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        },
      );
    } catch {
      setIsUploading(false);
      setDialogError("요청 처리에 실패했습니다.");
      return;
    }

    const result = await readCenterSeparationUpsertResponse(response);
    setIsUploading(false);

    if (!result.ok) {
      if (result.missingBarcodes.length > 0) {
        resetUploadDialog();
        setMissingBarcodesDialog(result.missingBarcodes);
        return;
      }

      setDialogError(result.error);
      return;
    }

    const { stats, missingBarcodes } = result.data;

    resetUploadDialog();
    setNotice(summarizeUpsert(stats, missingBarcodes));

    if (missingBarcodes.length > 0) {
      setMissingBarcodesDialog(missingBarcodes);
    }

    router.refresh();
  }

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-2">
        <AddCard
          title="바코드 단건 추가"
          description="바코드 하나를 입력해 바로 등록합니다. 대시보드에 있는 상품만 등록할 수 있습니다."
        >
          <form
            className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAddBarcode();
            }}
          >
            <Input
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="바코드 입력"
              className="min-w-0 flex-1 font-mono"
              disabled={isBusy}
            />
            <Button type="submit" size="sm" disabled={!canAdd} className="shrink-0">
              {isAdding ? "추가 중..." : "추가"}
            </Button>
          </form>
        </AddCard>

        <AddCard
          title="엑셀 대량 등록"
          description="여러 바코드를 한 번에 등록합니다. 대시보드에 있는 바코드만 등록되며, 없는 바코드는 업로드 후 목록으로 안내됩니다."
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={handleDownloadTemplate}
            >
              {isDownloading ? "다운로드 중..." : "엑셀 템플릿 다운로드"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isBusy}
              onClick={() => {
                setDialogError(null);
                setUploadDialogOpen(true);
              }}
            >
              엑셀 업로드
            </Button>
          </div>
        </AddCard>
      </section>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="text-sm text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}

      <Dialog
        open={singleMissingDialogOpen}
        onOpenChange={setSingleMissingDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>바코드를 등록할 수 없습니다</DialogTitle>
            <DialogDescription>
              {CENTER_SEPARATION_MISSING_BARCODE_ERROR}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setSingleMissingDialogOpen(false)}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={missingBarcodesDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMissingBarcodesDialog(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>대시보드에 없는 바코드</DialogTitle>
            <DialogDescription>
              {missingBarcodesDialog?.length.toLocaleString()}건의 바코드는
              대시보드에 없어 등록되지 않았습니다.
            </DialogDescription>
          </DialogHeader>

          {missingBarcodesDialog ? (
            <MissingBarcodesList barcodes={missingBarcodesDialog} />
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setMissingBarcodesDialog(null)}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (!isUploading) {
              resetUploadDialog();
            }
            return;
          }

          setUploadDialogOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>엑셀 업로드</DialogTitle>
            <DialogDescription>
              바코드 열이 포함된 엑셀 파일을 드래그하거나 선택한 뒤 확인을
              누르면 등록됩니다.
            </DialogDescription>
          </DialogHeader>

          <ExcelDropzone
            multiple={false}
            disabled={isUploading}
            description="엑셀 파일을 드래그하거나 클릭하여 선택"
            onFilesSelected={handleFilesSelected}
          />

          {file ? (
            <ExcelFileList
              files={[
                {
                  id: file.name,
                  file,
                  targetId: "center_separation_barcode",
                },
              ]}
              onRemove={() => {
                setFile(null);
                setDialogError(null);
              }}
            />
          ) : null}

          {dialogError ? (
            <p className="text-sm text-destructive" role="alert">
              {dialogError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={resetUploadDialog}
            >
              취소
            </Button>
            <Button
              type="button"
              disabled={!canConfirmUpload}
              onClick={handleConfirmUpload}
            >
              {isUploading ? "업로드 중..." : "확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

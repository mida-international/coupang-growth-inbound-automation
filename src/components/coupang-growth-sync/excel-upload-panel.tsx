"use client";

import Link from "next/link";
import { useState } from "react";

import { ExcelDropzone } from "@/components/excel/excel-dropzone";
import { ExcelFileList } from "@/components/excel/excel-file-list";
import { apiPostFormData } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { detectExcelTargetIdFromFile } from "@/lib/excel/detect-target-client";
import type {
  ExcelIngestionTargetId,
  SelectedExcelFile,
} from "@/lib/excel/types";
import { isExcelFile } from "@/lib/excel/validate-file";
import { cn } from "@/lib/utils";
import type { ExcelUploadResponse } from "@/services/coupang-growth-sync/types";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

const COUPANG_GROWTH_TARGET_IDS = [
  "coupang_growth_inbound_template",
  "coupang_growth_inventory_health",
] as const satisfies readonly ExcelIngestionTargetId[];

function createFileId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
}

function getDefaultSellerAccountId(accounts: SellerAccountView[]): string {
  const match = accounts.find(
    (account) =>
      account.isActive &&
      account.displayName.trim().toLowerCase() === "mizucos",
  );

  return match?.id ?? "";
}

function UploadSection({
  title,
  description,
  children,
  variant = "muted",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: "muted" | "plain";
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border p-4 sm:p-5",
        variant === "muted" ? "bg-muted/50" : "bg-background",
      )}
    >
      <div className="mb-4 flex items-start gap-3 border-b border-border/60 pb-4">
        <span
          className="mt-1 h-4 w-1 shrink-0 rounded-full bg-primary"
          aria-hidden
        />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ExcelUploadPanel({
  accounts,
}: {
  accounts: SellerAccountView[];
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    getDefaultSellerAccountId(accounts),
  );
  const [files, setFiles] = useState<SelectedExcelFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [unrecognizedDialog, setUnrecognizedDialog] = useState<{
    open: boolean;
    fileNames: string[];
  }>({ open: false, fileNames: [] });

  async function detectFileTarget(fileId: string, file: File) {
    const targetId = await detectExcelTargetIdFromFile(
      file,
      COUPANG_GROWTH_TARGET_IDS,
    );

    setFiles((current) =>
      current.map((entry) =>
        entry.id === fileId
          ? { ...entry, targetId, detecting: false }
          : entry,
      ),
    );

    if (!targetId) {
      setUnrecognizedDialog((current) => ({
        open: true,
        fileNames: [...new Set([...current.fileNames, file.name])],
      }));
    }
  }

  function addFiles(incoming: File[]) {
    if (!selectedAccountId) {
      setFileError("쿠팡 판매자 계정을 선택해 주세요.");
      return;
    }

    const pendingFiles: SelectedExcelFile[] = [];
    const invalidNames: string[] = [];

    for (const file of incoming) {
      if (!isExcelFile(file)) {
        invalidNames.push(file.name);
        continue;
      }

      const isDuplicate = files.some(
        (entry) =>
          entry.file.name === file.name &&
          entry.file.size === file.size &&
          entry.file.lastModified === file.lastModified,
      );

      if (isDuplicate) {
        continue;
      }

      const entry: SelectedExcelFile = {
        id: createFileId(file),
        file,
        targetId: null,
        detecting: true,
      };

      pendingFiles.push(entry);
    }

    if (invalidNames.length > 0) {
      setFileError(
        `엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다: ${invalidNames.join(", ")}`,
      );
    } else {
      setFileError(null);
    }

    if (pendingFiles.length > 0) {
      setFiles((current) => [...current, ...pendingFiles]);
      setUploadNotice(null);

      for (const entry of pendingFiles) {
        void detectFileTarget(entry.id, entry.file);
      }
    }
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((entry) => entry.id !== id));
    setUploadNotice(null);
  }

  async function handleUpload() {
    if (!selectedAccountId || files.length === 0 || uploading) {
      return;
    }

    setUploading(true);
    setUploadNotice(null);
    setFileError(null);

    const formData = new FormData();
    formData.append("coupangSellerAccountId", selectedAccountId);

    for (const entry of files) {
      formData.append("files", entry.file);
    }

    const result = await apiPostFormData<ExcelUploadResponse>(
      "/api/coupang-growth-sync/excel-upload",
      formData,
    );

    setUploading(false);

    if (!result.ok) {
      setFileError(result.error);
      return;
    }

    const successResults = result.data.results.filter((item) => item.ok);
    const failedResults = result.data.results.filter((item) => !item.ok);

    if (successResults.length > 0) {
      const summary = successResults
        .map((item) => `${item.fileName}: ${item.rowCount ?? 0}건 적재`)
        .join(", ");

      setUploadNotice(summary);
      setFiles([]);
    }

    if (failedResults.length > 0) {
      setFileError(
        failedResults
          .map((item) => `${item.fileName}: ${item.error ?? "실패"}`)
          .join(" / "),
      );
    }
  }

  const isDetecting = files.some((entry) => entry.detecting);
  const allFilesIdentified =
    files.length > 0 && files.every((entry) => entry.targetId !== null);
  const canUpload = Boolean(
    selectedAccountId &&
      files.length > 0 &&
      allFilesIdentified &&
      !isDetecting &&
      !uploading,
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle>엑셀 업로드</CardTitle>
        <CardDescription>
          쿠팡 판매자 계정을 선택하고 입고 템플릿·재고 현황 엑셀을 업로드합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 bg-muted/15 p-(--card-spacing)">
        <UploadSection
          title="쿠팡 판매자 계정"
          description="동기화할 쿠팡 판매자 계정을 하나 선택합니다."
          variant="muted"
        >
          {accounts.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                등록된 판매자 계정이 없습니다.
              </p>
              <Button
                render={<Link href="/data/coupang-growth/seller-accounts" />}
                variant="link"
                className="mt-2 h-auto p-0"
              >
                쿠팡 판매자 계정 관리로 이동
              </Button>
            </div>
          ) : (
            <FieldGroup
              className="gap-3"
              role="radiogroup"
              aria-label="쿠팡 판매자 계정"
            >
              {accounts.map((account) => {
                const inputId = `seller-account-${account.id}`;

                return (
                  <Field
                    key={account.id}
                    orientation="horizontal"
                    data-disabled={!account.isActive}
                    className={cn(!account.isActive && "opacity-60")}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name="seller-account"
                      value={account.id}
                      checked={selectedAccountId === account.id}
                      disabled={!account.isActive}
                      onChange={() => {
                        setSelectedAccountId(account.id);
                        setUploadNotice(null);
                      }}
                      className="size-4 shrink-0 accent-primary"
                    />
                    <FieldLabel htmlFor={inputId} className="font-normal">
                      {account.displayName}
                      {!account.isActive ? (
                        <span className="text-muted-foreground">(비활성)</span>
                      ) : null}
                    </FieldLabel>
                  </Field>
                );
              })}
            </FieldGroup>
          )}
        </UploadSection>

        <UploadSection
          title="엑셀 파일"
          description="입고 템플릿·재고 현황 엑셀을 함께 올릴 수 있습니다."
          variant="plain"
        >
          <ExcelDropzone
            description={
              selectedAccountId
                ? "파일을 드래그하거나 클릭하여 선택 (여러 파일 가능)"
                : "판매자 계정을 먼저 선택해 주세요."
            }
            disabled={!selectedAccountId}
            onFilesSelected={addFiles}
          />
          <ExcelFileList files={files} onRemove={removeFile} />
          {fileError ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {fileError}
            </p>
          ) : null}
        </UploadSection>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {uploadNotice ? (
            <p
              className="text-sm text-muted-foreground sm:mr-auto"
              role="status"
            >
              {uploadNotice}
            </p>
          ) : null}
          <Button type="button" disabled={!canUpload} onClick={handleUpload}>
            {uploading ? "업로드 중..." : "업로드"}
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={unrecognizedDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setUnrecognizedDialog({ open: false, fileNames: [] });
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>엑셀 파일을 인식할 수 없습니다</DialogTitle>
            <DialogDescription>
              {unrecognizedDialog.fileNames.join(", ")}
              <br />
              지원 형식: 입고 생성 템플릿, 재고 현황. 헤더(등록상품 ID, 옵션 ID
              등)를 확인해 주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() =>
                setUnrecognizedDialog({ open: false, fileNames: [] })
              }
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

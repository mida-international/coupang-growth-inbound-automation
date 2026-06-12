"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

const EXCEL_EXTENSIONS = [".xlsx", ".xls"] as const;
const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;
const FILE_INPUT_ACCEPT =
  ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isExcelFile(file: File) {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  if (EXCEL_EXTENSIONS.includes(extension as (typeof EXCEL_EXTENSIONS)[number])) {
    return true;
  }

  return file.type
    ? EXCEL_MIME_TYPES.includes(file.type as (typeof EXCEL_MIME_TYPES)[number])
    : false;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  function selectFile(nextFile: File | null) {
    if (!nextFile) {
      setFile(null);
      setFileError(null);
      return;
    }

    if (!isExcelFile(nextFile)) {
      setFile(null);
      setFileError("엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.");
      return;
    }

    setFile(nextFile);
    setFileError(null);
    setUploadNotice(null);
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0] ?? null);
  }

  function handleUpload() {
    if (!selectedAccountId || !file) {
      return;
    }

    setUploadNotice("업로드 기능은 준비 중입니다. 곧 연결될 예정입니다.");
  }

  const canUpload = Boolean(selectedAccountId && file);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle>엑셀 업로드</CardTitle>
        <CardDescription>
          쿠팡 판매자 계정을 선택하고 상품 정보 엑셀 파일을 업로드합니다.
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
            <FieldGroup className="gap-3" role="radiogroup" aria-label="쿠팡 판매자 계정">
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
          description="드래그 앤 드롭하거나 클릭하여 .xlsx, .xls 파일을 선택합니다."
          variant="plain"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_INPUT_ACCEPT}
            className="sr-only"
            onChange={handleFileInputChange}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:border-primary/50 hover:bg-muted/30",
            )}
          >
            <Upload className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium text-foreground">
              파일을 드래그하거나 클릭하여 선택
            </p>
            <p className="text-xs text-muted-foreground">
              지원 형식: .xlsx, .xls
            </p>
          </div>

          {file ? (
            <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
              <FileSpreadsheet
                className="size-5 shrink-0 text-primary"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="선택 파일 제거"
                onClick={() => selectFile(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}

          {fileError ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {fileError}
            </p>
          ) : null}
        </UploadSection>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" disabled={!canUpload} onClick={handleUpload}>
            업로드
          </Button>
          {uploadNotice ? (
            <p className="text-sm text-muted-foreground" role="status">
              {uploadNotice}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

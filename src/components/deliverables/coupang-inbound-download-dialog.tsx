"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  checkCoupangInboundDuplicates,
  hashSourceFiles,
  type ClientSourceFile,
  type CoupangInboundDuplicateCheck,
} from "@/lib/deliverables/client/record-coupang-inbound";

export type CoupangInboundDownloadChoice = "download" | "download-and-record";

/** 팝업에서 선택을 기다리는 다운로드 1건 */
export type PendingCoupangInboundDownload = CoupangInboundDuplicateCheck & {
  /** 중복 확인에 실패했으면 그 이유 (다운로드는 막지 않는다) */
  checkError: string | null;
  sellerId: string;
  /** 사용자가 업로드한 원본 (엑셀 1개 또는 이미지 여러 장) */
  files: File[];
  sourceFiles: ClientSourceFile[];
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type CoupangInboundDownloadDialogProps = {
  pending: PendingCoupangInboundDownload | null;
  onChoose: (choice: CoupangInboundDownloadChoice) => void;
  onCancel: () => void;
};

/**
 * 쿠팡 입고 템플릿 다운로드 시 항상 뜨는 팝업.
 * 다운로드만 할지, 다운로드와 함께 입고 기록(+추세 시트 반영)까지 할지 고른다.
 * 오늘 같은 원본으로 기록된 게 있으면 기존 기록을 보여주고 경고한다.
 */
export function CoupangInboundDownloadDialog({
  pending,
  onChoose,
  onCancel,
}: CoupangInboundDownloadDialogProps) {
  const hasDuplicates = (pending?.duplicates.length ?? 0) > 0;
  const recordLabel = pending?.sheetSync ? "기록·시트 반영" : "기록";

  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasDuplicates ? (
              <TriangleAlert className="size-5 text-destructive" aria-hidden />
            ) : null}
            {hasDuplicates ? "오늘 이미 기록한 파일입니다" : "입고 템플릿 다운로드"}
          </DialogTitle>
          <DialogDescription className="pt-1 text-sm text-foreground">
            {hasDuplicates
              ? `같은 원본 파일로 오늘 이미 기록했습니다. 아래 기록을 확인하고, 새 입고가 맞을 때만 ${recordLabel}하세요.`
              : `다운로드와 함께 입고 ${recordLabel}까지 할까요?`}
            {pending?.sheetSync && !hasDuplicates
              ? " 기록하면 추세 시트의 오늘 '(완)' 열이 오늘 합계로 갱신됩니다."
              : null}
          </DialogDescription>
          {pending?.checkError ? (
            <p className="text-sm text-destructive">
              오늘 같은 파일로 기록했는지 확인하지 못했습니다 ({pending.checkError}).
              기록 전에 쿠팡 입고 기록 이력을 확인해 주세요.
            </p>
          ) : null}
        </DialogHeader>

        {hasDuplicates && pending ? (
          <ul className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
            {pending.duplicates.map((duplicate) => (
              <li key={duplicate.id} className="space-y-1">
                <p className="font-medium">
                  {formatTime(duplicate.recordedAt)} · {duplicate.recordedByName}
                  {duplicate.sourceFileName ? ` · ${duplicate.sourceFileName}` : ""}
                </p>
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {duplicate.sourceFiles.map((file) =>
                    file.stored ? (
                      <a
                        key={file.index}
                        href={`/api/coupang-inbound-deliverables/${duplicate.id}/sources/${file.index}`}
                        className="text-primary underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        원본: {file.name}
                      </a>
                    ) : (
                      <span key={file.index} className="text-muted-foreground">
                        원본: {file.name} (파일 미저장)
                      </span>
                    ),
                  )}
                  <a
                    href={`/api/coupang-inbound-deliverables/${duplicate.id}/download`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    생성 템플릿: {duplicate.outputFileName}
                  </a>
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant={hasDuplicates ? "default" : "outline"}
            onClick={() => onChoose("download")}
          >
            다운로드만
          </Button>
          <Button
            type="button"
            variant={hasDuplicates ? "destructive" : "default"}
            onClick={() => onChoose("download-and-record")}
          >
            {hasDuplicates ? `그래도 다운로드 + ${recordLabel}` : `다운로드 + ${recordLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 다운로드 버튼 → (원본 해시 계산 + 오늘 중복 확인) → 팝업 → 선택 결과로 onConfirm 실행.
 * 산출물 화면과 텔레그램 화면이 같은 흐름을 쓰도록 묶었다.
 */
export function useCoupangInboundDownloadDialog(
  onConfirm: (
    choice: CoupangInboundDownloadChoice,
    pending: PendingCoupangInboundDownload,
  ) => Promise<void>,
) {
  const [pending, setPending] = useState<PendingCoupangInboundDownload | null>(
    null,
  );
  const [isPreparing, setIsPreparing] = useState(false);

  async function open(sellerId: string, files: File[]): Promise<void> {
    setIsPreparing(true);

    let sourceFiles: ClientSourceFile[] = [];

    try {
      sourceFiles = await hashSourceFiles(files);
      const check = await checkCoupangInboundDuplicates(sellerId, sourceFiles);
      setPending({ ...check, checkError: null, sellerId, files, sourceFiles });
    } catch (error) {
      // 중복 확인이 실패해도 다운로드는 할 수 있어야 한다 (팝업에 안내만 표시).
      setPending({
        duplicates: [],
        sheetSync: false,
        checkError: error instanceof Error ? error.message : "알 수 없는 오류",
        sellerId,
        files,
        sourceFiles,
      });
    } finally {
      setIsPreparing(false);
    }
  }

  function choose(choice: CoupangInboundDownloadChoice) {
    const current = pending;
    setPending(null);

    if (current) {
      void onConfirm(choice, current);
    }
  }

  return {
    open,
    isPreparing,
    dialog: (
      <CoupangInboundDownloadDialog
        pending={pending}
        onChoose={choose}
        onCancel={() => setPending(null)}
      />
    ),
  };
}

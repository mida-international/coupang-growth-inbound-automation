"use client";

import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ErrorNoticeDialogProps = {
  message: string | null;
  onClose: () => void;
};

/** 작업 실패 메시지를 인라인 텍스트 대신 알림창으로 보여준다. */
export function ErrorNoticeDialog({ message, onClose }: ErrorNoticeDialogProps) {
  return (
    <Dialog
      open={message !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleAlert className="size-5 text-destructive" aria-hidden />
            알림
          </DialogTitle>
          <DialogDescription className="pt-1 whitespace-pre-line text-sm text-foreground">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

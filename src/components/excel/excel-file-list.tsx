"use client";

import { FileSpreadsheet, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTargetById } from "@/lib/excel/targets/registry";
import type { SelectedExcelFile } from "@/lib/excel/types";
import { formatFileSize } from "@/lib/excel/validate-file";

type ExcelFileListProps = {
  files: SelectedExcelFile[];
  onRemove: (id: string) => void;
};

export function ExcelFileList({ files, onRemove }: ExcelFileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <ul className="mt-3 flex flex-col gap-2">
      {files.map((entry) => {
        const target = entry.targetId ? getTargetById(entry.targetId) : null;

        return (
          <li
            key={entry.id}
            className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
          >
            <FileSpreadsheet
              className="size-5 shrink-0 text-primary"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.file.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(entry.file.size)}
                </p>
                {entry.detecting ? (
                  <Badge variant="outline" className="text-xs">
                    유형 확인 중...
                  </Badge>
                ) : target ? (
                  <Badge variant="secondary" className="text-xs">
                    {target.label}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-amber-700">
                    파일 유형 미식별
                  </Badge>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`${entry.file.name} 제거`}
              onClick={() => onRemove(entry.id)}
            >
              <X className="size-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

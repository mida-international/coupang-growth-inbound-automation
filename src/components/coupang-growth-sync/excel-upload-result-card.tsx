"use client";

import { getTargetById } from "@/lib/excel/targets/registry";
import { cn } from "@/lib/utils";
import type { ExcelUploadResultSummary } from "@/services/coupang-growth-sync/types";

const OUTCOME_HEADLINE: Record<
  ExcelUploadResultSummary["outcome"],
  { text: string; className: string }
> = {
  success: {
    text: "업로드가 완료되었습니다.",
    className: "text-primary",
  },
  partial: {
    text: "일부 파일만 업로드되었습니다.",
    className: "text-amber-700 dark:text-amber-500",
  },
  error: {
    text: "업로드에 실패했습니다.",
    className: "text-destructive",
  },
};

type ExcelUploadResultCardProps = {
  result: ExcelUploadResultSummary;
};

export function ExcelUploadResultCard({ result }: ExcelUploadResultCardProps) {
  const headline = OUTCOME_HEADLINE[result.outcome];
  const successResults = result.results.filter((item) => item.ok);
  const failedResults = result.results.filter((item) => !item.ok);

  return (
    <div
      className="space-y-3 rounded-md border border-border p-4 text-sm"
      role="status"
      aria-live="polite"
    >
      <p className={cn("font-medium", headline.className)}>{headline.text}</p>

      {successResults.length > 0 ? (
        <ul className="space-y-1.5">
          {successResults.map((item) => {
            const targetLabel = item.targetId
              ? getTargetById(item.targetId)?.label
              : null;

            return (
              <li key={item.fileName} className="text-foreground">
                <span className="font-medium">{item.fileName}</span>
                {targetLabel ? (
                  <span className="text-muted-foreground"> · {targetLabel}</span>
                ) : null}
                <span className="text-muted-foreground">
                  {" "}
                  · {(item.rowCount ?? 0).toLocaleString()}건 적재
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {failedResults.length > 0 ? (
        <ul className="space-y-1.5">
          {failedResults.map((item) => (
            <li key={item.fileName} className="text-destructive">
              <span className="font-medium">{item.fileName}</span>
              <span> · {item.error ?? "실패"}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

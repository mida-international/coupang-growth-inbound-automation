"use client";

import { CircleAlert, CircleCheck, CircleX } from "lucide-react";

import type { ShoplingInboundValidationRow } from "@/services/deliverables/types";

const FAILURE_REASON: Record<string, string> = {
  unmapped: "재고 데이터에서 상품·옵션을 찾지 못함",
  ambiguous: "여러 바코드와 매칭됨 (모호)",
  skippedDummy: "더미 바코드 제외",
};

const CANDIDATE_OPTION_PREVIEW = 6;

function describeRow(row: ShoplingInboundValidationRow): string {
  if (row.status === "matched") {
    return row.estimated
      ? `추정 매칭 — 샵플링 옵션 "${row.matchedOption ?? ""}" 확인 필요`
      : "—";
  }

  if (row.status === "unmapped" && row.unmappedReason === "productNotFound") {
    return "샵플링에 해당 상품이 없음 (품명 확인)";
  }

  if (row.status === "unmapped" && row.unmappedReason === "optionNotFound") {
    const options = row.candidateOptions ?? [];
    const preview = options.slice(0, CANDIDATE_OPTION_PREVIEW).join(", ");
    const more =
      options.length > CANDIDATE_OPTION_PREVIEW
        ? ` 외 ${options.length - CANDIDATE_OPTION_PREVIEW}개`
        : "";

    return options.length > 0
      ? `옵션 불일치 — 샵플링 옵션: ${preview}${more}`
      : "옵션 불일치 — 샵플링에 사용 가능한 옵션 없음";
  }

  return FAILURE_REASON[row.status] ?? "미매칭";
}

type ShoplingInboundValidationTableProps = {
  rows: ShoplingInboundValidationRow[];
};

export function ShoplingInboundValidationTable({
  rows,
}: ShoplingInboundValidationTableProps) {
  if (rows.length === 0) {
    return null;
  }

  const successCount = rows.filter((row) => row.status === "matched").length;
  const failCount = rows.length - successCount;
  const estimatedCount = rows.filter(
    (row) => row.status === "matched" && row.estimated,
  ).length;

  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">검증 결과</p>
        <p className="text-xs text-muted-foreground">
          전체 {rows.length}건{" "}
          <span className="font-medium text-primary">성공 {successCount}건</span>{" "}
          {estimatedCount > 0 ? (
            <>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                (추정 {estimatedCount}건 확인 필요)
              </span>{" "}
            </>
          ) : null}
          <span className="font-medium text-destructive">
            실패 {failCount}건
          </span>
        </p>
      </div>

      <div className="max-h-[420px] overflow-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <tr>
              <th className="px-3 py-2 font-medium text-muted-foreground">#</th>
              <th className="px-3 py-2 font-medium text-muted-foreground">
                자사상품명
              </th>
              <th className="px-3 py-2 font-medium text-muted-foreground">
                옵션
              </th>
              <th className="px-3 py-2 font-medium text-muted-foreground">
                수량
              </th>
              <th className="px-3 py-2 font-medium text-muted-foreground">
                바코드
              </th>
              <th className="px-3 py-2 font-medium text-muted-foreground">
                반영여부
              </th>
              <th className="px-3 py-2 font-medium text-muted-foreground">
                미매칭 사유 / 비고
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isMatched = row.status === "matched";
              const isEstimated = isMatched && row.estimated === true;

              return (
                <tr
                  key={`${row.ptnGoodsCd}-${row.optionValue}-${index}`}
                  className={
                    isEstimated
                      ? "border-t border-border/60 bg-amber-500/10"
                      : isMatched
                        ? "border-t border-border/60"
                        : "border-t border-border/60 bg-destructive/5"
                  }
                >
                  <td className="px-3 py-2 text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="max-w-[16rem] truncate px-3 py-2">
                    {row.ptnGoodsCd}
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-2">
                    {row.optionValue || "-"}
                  </td>
                  <td className="px-3 py-2">{row.quantity}</td>
                  <td className="px-3 py-2 font-mono">{row.barcode ?? "—"}</td>
                  <td className="px-3 py-2">
                    {isEstimated ? (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                        <CircleAlert className="size-3.5" aria-hidden />
                        성공(추정)
                      </span>
                    ) : isMatched ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                        <CircleCheck className="size-3.5" aria-hidden />
                        성공
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-destructive">
                        <CircleX className="size-3.5" aria-hidden />
                        실패
                      </span>
                    )}
                  </td>
                  <td className="min-w-[16rem] px-3 py-2 text-muted-foreground">
                    {describeRow(row)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { CircleCheck, CircleX } from "lucide-react";

import type { ShoplingInboundValidationRow } from "@/services/deliverables/types";

const FAILURE_REASON: Record<string, string> = {
  unmapped: "재고 데이터에서 상품·옵션을 찾지 못함",
  ambiguous: "여러 바코드와 매칭됨 (모호)",
  skippedDummy: "더미 바코드 제외",
};

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

  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">검증 결과</p>
        <p className="text-xs text-muted-foreground">
          전체 {rows.length}건{" "}
          <span className="font-medium text-primary">성공 {successCount}건</span>{" "}
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
                미매칭 사유
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isMatched = row.status === "matched";

              return (
                <tr
                  key={`${row.ptnGoodsCd}-${row.optionValue}-${index}`}
                  className={
                    isMatched
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
                    {isMatched ? (
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
                  <td className="px-3 py-2 text-muted-foreground">
                    {isMatched ? "—" : (FAILURE_REASON[row.status] ?? "미매칭")}
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

"use client";

import { Fragment, useState } from "react";

import {
  LIST_TABLE_STICKY_HEADER_CLASS,
  LIST_TABLE_STICKY_LEFT_HEADER_CLASS,
} from "@/components/data-list/list-table-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { InboundTrendsRowView } from "@/services/inbound-trends/types";

type TrendsDateColumnKind = "coupang" | "warehouse";

type TrendsTableProps = {
  rows: InboundTrendsRowView[];
  dates: string[];
  sellerId: string;
};

function formatCell(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) {
    return "-";
  }

  return value;
}

function formatQty(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return value.toLocaleString();
}

function formatDateHeader(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function buildColumnTitle(date: string, kind: TrendsDateColumnKind): string {
  const base = formatDateHeader(date);
  return kind === "coupang" ? `${base}(완)` : base;
}

const STICKY_LEFT_BODY_CLASS =
  "sticky z-10 bg-background after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-border";

export function TrendsTable({ rows, dates, sellerId }: TrendsTableProps) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (rows.length === 0) {
    return null;
  }

  async function handlePushColumn(date: string, kind: TrendsDateColumnKind) {
    if (!sellerId) {
      setNotice("판매자 계정을 선택해 주세요.");
      return;
    }

    const title = buildColumnTitle(date, kind);
    const key = `${date}:${kind}`;

    if (
      !window.confirm(
        `구글 시트에 '${title}' 열을 P열에 삽입하고 바코드(O열)와 매칭해 값을 채웁니다.\n진행할까요?`,
      )
    ) {
      return;
    }

    setPendingKey(key);
    setNotice(null);

    try {
      const response = await fetch(
        "/api/downloads/inbound-trends/date-column-to-sheet",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seller: sellerId, date, kind, title }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | {
            ok: true;
            data: {
              sheetUrl: string;
              matchedCount: number;
              barcodeRowCount: number;
            };
          }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !payload || !("ok" in payload) || !payload.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "시트 기입에 실패했습니다.",
        );
      }

      setNotice(
        `'${title}' 열 삽입 완료 — O열 바코드 ${payload.data.barcodeRowCount}개 중 ${payload.data.matchedCount}개 매칭`,
      );

      if (payload.data.sheetUrl) {
        window.open(payload.data.sheetUrl, "_blank");
      }
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "시트 기입에 실패했습니다.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  function renderSheetButton(date: string, kind: TrendsDateColumnKind) {
    const key = `${date}:${kind}`;
    const isPending = pendingKey === key;

    return (
      <button
        type="button"
        disabled={pendingKey !== null}
        onClick={() => handlePushColumn(date, kind)}
        title={`'${buildColumnTitle(date, kind)}' 열을 구글 시트에 삽입`}
        className={cn(
          "mt-0.5 rounded border border-border bg-background px-1 text-[10px] leading-4 text-muted-foreground transition-colors",
          pendingKey === null
            ? "hover:border-primary/50 hover:text-foreground"
            : "cursor-not-allowed opacity-50",
        )}
      >
        {isPending ? "전송…" : "→시트"}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {notice ? (
        <p
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {notice}
        </p>
      ) : null}

      <Table containerClassName="overflow-visible">
        <TableHeader className="bg-muted [&_th]:bg-muted">
          <TableRow className="hover:bg-transparent">
            <TableHead
              rowSpan={2}
              className={cn(
                LIST_TABLE_STICKY_LEFT_HEADER_CLASS,
                "left-0 min-w-[160px]",
              )}
            >
              상품명
            </TableHead>
            <TableHead
              rowSpan={2}
              className={cn(
                LIST_TABLE_STICKY_LEFT_HEADER_CLASS,
                "left-[160px] min-w-[120px]",
              )}
            >
              옵션명
            </TableHead>
            <TableHead
              rowSpan={2}
              className={cn(
                LIST_TABLE_STICKY_LEFT_HEADER_CLASS,
                "left-[280px] min-w-[110px]",
              )}
            >
              자사상품코드
            </TableHead>
            <TableHead
              rowSpan={2}
              className={cn(
                LIST_TABLE_STICKY_LEFT_HEADER_CLASS,
                "left-[390px] min-w-[140px]",
              )}
            >
              샵플링 옵션 벨류
            </TableHead>
            <TableHead
              rowSpan={2}
              className={cn(
                LIST_TABLE_STICKY_LEFT_HEADER_CLASS,
                "left-[530px] min-w-[120px]",
              )}
            >
              바코드
            </TableHead>
            {dates.map((date) => (
              <TableHead
                key={date}
                colSpan={2}
                className={cn(
                  LIST_TABLE_STICKY_HEADER_CLASS,
                  "border-l border-border text-center",
                )}
              >
                {formatDateHeader(date)}
              </TableHead>
            ))}
          </TableRow>
          <TableRow className="hover:bg-transparent">
            {dates.map((date) => (
              <Fragment key={date}>
                <TableHead
                  className={cn(
                    LIST_TABLE_STICKY_HEADER_CLASS,
                    "min-w-[72px] border-l border-border text-right text-xs",
                  )}
                >
                  <div className="flex flex-col items-end">
                    <span>{formatDateHeader(date)}(완)</span>
                    {renderSheetButton(date, "coupang")}
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    LIST_TABLE_STICKY_HEADER_CLASS,
                    "min-w-[72px] text-right text-xs",
                  )}
                >
                  <div className="flex flex-col items-end">
                    <span>{formatDateHeader(date)}</span>
                    {renderSheetButton(date, "warehouse")}
                  </div>
                </TableHead>
              </Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.rowKey}>
              <TableCell className={cn(STICKY_LEFT_BODY_CLASS, "left-0")}>
                {formatCell(row.registeredProductName)}
              </TableCell>
              <TableCell className={cn(STICKY_LEFT_BODY_CLASS, "left-[160px]")}>
                {formatCell(row.optionName)}
              </TableCell>
              <TableCell className={cn(STICKY_LEFT_BODY_CLASS, "left-[280px]")}>
                {formatCell(row.ptnGoodsCd)}
              </TableCell>
              <TableCell className={cn(STICKY_LEFT_BODY_CLASS, "left-[390px]")}>
                {formatCell(row.shoplingOptionValue)}
              </TableCell>
              <TableCell className={cn(STICKY_LEFT_BODY_CLASS, "left-[530px]")}>
                {formatCell(row.productBarcode)}
              </TableCell>
              {dates.map((date) => {
                const values = row.dateValues[date];

                return (
                  <Fragment key={date}>
                    <TableCell className="border-l border-border text-right tabular-nums">
                      {formatQty(values?.coupang)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatQty(values?.warehouse)}
                    </TableCell>
                  </Fragment>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { buildTrendsQuery } from "@/components/inbound-trends/build-trends-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import {
  INBOUND_TRENDS_DEFAULT_PAGE_SIZE,
  INBOUND_TRENDS_PAGE_SIZE_OPTIONS,
} from "@/services/inbound-trends/types";
import { TRENDS_DAY_PRESETS } from "@/services/inbound-trends/resolve-trends-date-range";

const BASE_PATH = "/trends";

type TrendsSnapshotDates = {
  template: string;
  health: string | null;
  shopling: string | null;
};

type TrendsToolbarProps = {
  accounts: SellerAccountView[];
  sellerId: string;
  search: string;
  page: number;
  pageSize: number;
  totalCount: number;
  snapshotDates: TrendsSnapshotDates | null;
  from: string;
  to: string;
  days: number | null;
};

function formatSnapshotLine(dates: TrendsSnapshotDates | null): string {
  if (!dates) {
    return "스냅샷 없음";
  }

  const parts = [`템플릿 ${dates.template}`];

  if (dates.health) {
    parts.push(`재고 ${dates.health}`);
  }

  if (dates.shopling) {
    parts.push(`샵플링 ${dates.shopling}`);
  }

  return parts.join(" · ");
}

function formatDateHeader(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function TrendsToolbar({
  accounts,
  sellerId,
  search,
  page,
  pageSize,
  totalCount,
  snapshotDates,
  from,
  to,
  days,
}: TrendsToolbarProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const showPagination = totalCount > 0;
  const activeAccounts = accounts.filter((account) => account.isActive);
  const useCustomRange = days === null;
  const canDownload = Boolean(sellerId) && totalCount > 0;

  const buildDownloadHref = () => {
    const params = new URLSearchParams();

    if (sellerId) {
      params.set("seller", sellerId);
    }

    if (useCustomRange) {
      if (from) {
        params.set("from", from);
      }

      if (to) {
        params.set("to", to);
      }
    } else if (days !== null) {
      params.set("days", String(days));
    }

    const trimmed = search.trim();

    if (trimmed) {
      params.set("q", trimmed);
    }

    return `/api/downloads/inbound-trends?${params.toString()}`;
  };

  const listQuery = (options: {
    seller?: string;
    q?: string;
    page?: number;
    pageSize?: number;
    from?: string;
    to?: string;
    days?: number | null;
  }) => {
    const nextDays =
      options.days !== undefined
        ? options.days
        : useCustomRange
          ? null
          : days;

    return buildTrendsQuery({
      seller: options.seller ?? sellerId,
      q: options.q ?? search,
      page: options.page,
      pageSize: options.pageSize ?? pageSize,
      defaultPageSize: INBOUND_TRENDS_DEFAULT_PAGE_SIZE,
      from: nextDays === null ? (options.from ?? from) : undefined,
      to: nextDays === null ? (options.to ?? to) : undefined,
      days: nextDays,
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
      <form
        method="GET"
        action={BASE_PATH}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="seller" className="text-xs text-muted-foreground">
              판매자
            </label>
            <select
              id="seller"
              name="seller"
              defaultValue={sellerId}
              disabled={activeAccounts.length === 0}
              aria-label="쿠팡 판매자 계정"
              className="h-9 min-w-[160px] rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
            >
              {activeAccounts.length === 0 ? (
                <option value="">판매자 계정 없음</option>
              ) : (
                activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.displayName}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="days" className="text-xs text-muted-foreground">
              조회 기간
            </label>
            <select
              id="days"
              name="days"
              defaultValue={useCustomRange ? "" : String(days ?? 14)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">직접 입력</option>
              {TRENDS_DAY_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  최근 {preset}일
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="from" className="text-xs text-muted-foreground">
              시작일
            </label>
            <Input
              id="from"
              name="from"
              type="date"
              defaultValue={from}
              className="h-9 w-full min-w-[150px] lg:w-[170px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="to" className="text-xs text-muted-foreground">
              종료일
            </label>
            <Input
              id="to"
              name="to"
              type="date"
              defaultValue={to}
              className="h-9 w-full min-w-[150px] lg:w-[170px]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            name="q"
            type="search"
            defaultValue={search}
            placeholder="상품명 · 옵션명 · 바코드 · 자사상품코드 검색"
            className="min-w-[200px] flex-1 sm:max-w-md"
          />
          <input type="hidden" name="pageSize" value={pageSize} />
          <Button type="submit" size="sm" className="shrink-0">
            조회
          </Button>
          {canDownload ? (
            <a
              href={buildDownloadHref()}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              다운로드
            </a>
          ) : (
            <Button type="button" variant="outline" size="sm" className="shrink-0" disabled>
              다운로드
            </Button>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {formatSnapshotLine(snapshotDates)} · {totalCount.toLocaleString()}건
          {from && to ? (
            <>
              {" "}
              · {formatDateHeader(from)}~{formatDateHeader(to)}
            </>
          ) : null}
        </p>

        {showPagination ? (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={pageSize}
              aria-label="표시 건수"
              onChange={(event) => {
                const nextPageSize = Number(event.target.value);
                router.push(
                  `${BASE_PATH}${listQuery({
                    page: 1,
                    pageSize: nextPageSize,
                  })}`,
                );
              }}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {INBOUND_TRENDS_PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}건
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              {hasPrev ? (
                <Link
                  href={`${BASE_PATH}${listQuery({ page: page - 1 })}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  이전
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  이전
                </Button>
              )}
              {hasNext ? (
                <Link
                  href={`${BASE_PATH}${listQuery({ page: page + 1 })}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  다음
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  다음
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

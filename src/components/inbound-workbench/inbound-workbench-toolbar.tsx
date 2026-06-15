"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { buildWorkbenchQuery } from "@/components/inbound-workbench/build-workbench-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import type { InboundWorkbenchSnapshotDates } from "@/services/inbound-workbench/types";
import { INBOUND_WORKBENCH_PAGE_SIZE_OPTIONS } from "@/services/inbound-workbench/types";

type InboundWorkbenchToolbarProps = {
  accounts: SellerAccountView[];
  sellerId: string;
  search: string;
  page: number;
  pageSize: number;
  totalCount: number;
  snapshotDates: InboundWorkbenchSnapshotDates | null;
};

function formatSnapshotLine(dates: InboundWorkbenchSnapshotDates | null): string {
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

export function InboundWorkbenchToolbar({
  accounts,
  sellerId,
  search,
  page,
  pageSize,
  totalCount,
  snapshotDates,
}: InboundWorkbenchToolbarProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const showPagination = totalCount > 0;
  const activeAccounts = accounts.filter((account) => account.isActive);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
      <form
        method="GET"
        action="/"
        className="flex flex-col gap-2 lg:flex-row lg:items-center"
      >
        <select
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
        <Input
          name="q"
          type="search"
          defaultValue={search}
          placeholder="상품명 · 옵션명 · 바코드 · 자사상품코드 검색"
          className="min-w-[200px] flex-1 lg:max-w-md"
        />
        <input type="hidden" name="pageSize" value={pageSize} />
        <Button type="submit" size="sm" className="shrink-0">
          조회
        </Button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {formatSnapshotLine(snapshotDates)} · {totalCount.toLocaleString()}건
        </p>

        {showPagination ? (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={pageSize}
              aria-label="표시 건수"
              onChange={(event) => {
                const nextPageSize = Number(event.target.value);
                router.push(
                  `/${buildWorkbenchQuery({
                    seller: sellerId,
                    q: search,
                    page: 1,
                    pageSize: nextPageSize,
                  })}`,
                );
              }}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {INBOUND_WORKBENCH_PAGE_SIZE_OPTIONS.map((size) => (
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
                  href={`/${buildWorkbenchQuery({
                    seller: sellerId,
                    q: search,
                    page: page - 1,
                    pageSize,
                  })}`}
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
                  href={`/${buildWorkbenchQuery({
                    seller: sellerId,
                    q: search,
                    page: page + 1,
                    pageSize,
                  })}`}
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

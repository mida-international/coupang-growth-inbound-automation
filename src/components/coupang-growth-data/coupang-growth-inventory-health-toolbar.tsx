"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { buildInventoryHealthQuery } from "@/components/coupang-growth-data/build-inventory-health-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { INVENTORY_HEALTH_ALL_SELLERS } from "@/services/coupang-growth-data/resolve-inventory-health-seller-filter";
import type { InventoryHealthSellerFilter } from "@/services/coupang-growth-data/resolve-inventory-health-seller-filter";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import {
  INVENTORY_HEALTH_DEFAULT_PAGE_SIZE,
  INVENTORY_HEALTH_PAGE_SIZE_OPTIONS,
} from "@/services/coupang-growth-data/types";

const BASE_PATH = "/data/coupang-growth/inventory-health";

type CoupangGrowthInventoryHealthToolbarProps = {
  accounts: SellerAccountView[];
  sellerFilter: InventoryHealthSellerFilter;
  search: string;
  page: number;
  pageSize: number;
  totalCount: number;
  snapshotDate: string | null;
  isAllSellers: boolean;
};

function formatSummaryLine(
  snapshotDate: string | null,
  isAllSellers: boolean,
  totalCount: number,
): string {
  const countLabel = `${totalCount.toLocaleString()}건`;

  if (isAllSellers) {
    return `판매자별 최신 · ${countLabel}`;
  }

  if (snapshotDate) {
    return `재고 ${snapshotDate} · ${countLabel}`;
  }

  return countLabel;
}

export function CoupangGrowthInventoryHealthToolbar({
  accounts,
  sellerFilter,
  search,
  page,
  pageSize,
  totalCount,
  snapshotDate,
  isAllSellers,
}: CoupangGrowthInventoryHealthToolbarProps) {
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
        action={BASE_PATH}
        className="flex flex-col gap-2 lg:flex-row lg:items-center"
      >
        <select
          name="seller"
          defaultValue={sellerFilter}
          disabled={activeAccounts.length === 0}
          aria-label="쿠팡 판매자 계정"
          className="h-9 min-w-[160px] rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
        >
          {activeAccounts.length === 0 ? (
            <option value="">판매자 계정 없음</option>
          ) : (
            <>
              <option value={INVENTORY_HEALTH_ALL_SELLERS}>전체</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.displayName}
                </option>
              ))}
            </>
          )}
        </select>
        <Input
          name="q"
          type="search"
          defaultValue={search}
          placeholder="상품명 · 옵션명 · 바코드 · 자사상품코드 · 판매자 검색"
          className="min-w-[200px] flex-1 lg:max-w-md"
        />
        <input type="hidden" name="pageSize" value={pageSize} />
        <Button type="submit" size="sm" className="shrink-0">
          조회
        </Button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {formatSummaryLine(snapshotDate, isAllSellers, totalCount)}
        </p>

        {showPagination ? (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={pageSize}
              aria-label="표시 건수"
              onChange={(event) => {
                const nextPageSize = Number(event.target.value);
                router.push(
                  `${BASE_PATH}${buildInventoryHealthQuery({
                    seller: sellerFilter,
                    q: search,
                    page: 1,
                    pageSize: nextPageSize,
                  })}`,
                );
              }}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {INVENTORY_HEALTH_PAGE_SIZE_OPTIONS.map((size) => (
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
                  href={`${BASE_PATH}${buildInventoryHealthQuery({
                    seller: sellerFilter,
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
                  href={`${BASE_PATH}${buildInventoryHealthQuery({
                    seller: sellerFilter,
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

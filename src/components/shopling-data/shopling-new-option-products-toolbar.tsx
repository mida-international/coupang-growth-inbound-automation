"use client";

import Link from "next/link";

import { buildShoplingListQuery } from "@/components/shopling-data/build-shopling-list-query";
import { DataListToolbarShell } from "@/components/data-list/data-list-toolbar-shell";
import { ListExcelDownloadButton } from "@/components/data-list/list-excel-download-button";
import { ShoplingPageSizeSelect } from "@/components/shopling-data/shopling-page-size-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  NEW_OPTION_PRODUCTS_DAY_PRESETS,
  SHOPLING_INVENTORY_DEFAULT_PAGE_SIZE,
  SHOPLING_INVENTORY_PAGE_SIZE_OPTIONS,
} from "@/services/shopling-data/types";

const BASE_PATH = "/data/shopling/new-option-products";

type ShoplingNewOptionProductsToolbarProps = {
  search: string;
  page: number;
  pageSize: number;
  totalCount: number;
  from: string;
  to: string;
  days: number | null;
};

export function ShoplingNewOptionProductsToolbar({
  search,
  page,
  pageSize,
  totalCount,
  from,
  to,
  days,
}: ShoplingNewOptionProductsToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const showPagination = totalCount > 0;
  const useCustomRange = days === null;

  const listQuery = (options: {
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

    return buildShoplingListQuery({
      q: options.q ?? search,
      page: options.page,
      pageSize: options.pageSize ?? pageSize,
      defaultPageSize: SHOPLING_INVENTORY_DEFAULT_PAGE_SIZE,
      from: nextDays === null ? (options.from ?? from) : undefined,
      to: nextDays === null ? (options.to ?? to) : undefined,
      days: nextDays,
    });
  };

  return (
    <DataListToolbarShell>
      <form
        method="GET"
        action={BASE_PATH}
        className="flex min-w-0 flex-col gap-3"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[8rem] flex-col gap-1">
            <label htmlFor="days" className="text-xs text-muted-foreground">
              조회 기간
            </label>
            <select
              id="days"
              name="days"
              defaultValue={useCustomRange ? "" : String(days ?? 7)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">직접 입력</option>
              {NEW_OPTION_PRODUCTS_DAY_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  최근 {preset}일
                </option>
              ))}
            </select>
          </div>

          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="from" className="text-xs text-muted-foreground">
              시작일
            </label>
            <Input
              id="from"
              name="from"
              type="date"
              defaultValue={from}
              className="h-9 w-full"
            />
          </div>

          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="to" className="text-xs text-muted-foreground">
              종료일
            </label>
            <Input
              id="to"
              name="to"
              type="date"
              defaultValue={to}
              className="h-9 w-full"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            name="q"
            type="search"
            defaultValue={search}
            placeholder="샵플링코드 · 옵션코드 · 자사상품코드 · 바코드 검색"
            className="min-w-0 flex-1 sm:max-w-md"
          />
          <input type="hidden" name="pageSize" value={pageSize} />
          <Button type="submit" size="sm" className="shrink-0">
            조회
          </Button>
        </div>
      </form>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {from} ~ {to} · {totalCount.toLocaleString()}건
        </p>

        {showPagination ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <ListExcelDownloadButton
              disabled={totalCount === 0}
              downloadHref={`/api/downloads/new-option-products${listQuery({})}`}
            />
            <ShoplingPageSizeSelect
              basePath={BASE_PATH}
              pageSize={pageSize}
              search={search}
              pageSizeOptions={SHOPLING_INVENTORY_PAGE_SIZE_OPTIONS}
              defaultPageSize={SHOPLING_INVENTORY_DEFAULT_PAGE_SIZE}
              from={useCustomRange ? from : undefined}
              to={useCustomRange ? to : undefined}
              days={useCustomRange ? null : days}
            />
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
    </DataListToolbarShell>
  );
}

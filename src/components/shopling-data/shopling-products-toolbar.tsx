import Link from "next/link";

import { buildProductsQuery } from "@/components/shopling-data/build-products-query";
import { ShoplingPageSizeSelect } from "@/components/shopling-data/shopling-page-size-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ShoplingProductsToolbarProps = {
  search: string;
  page: number;
  pageSize: number;
  totalCount: number;
  snapshotDate: string | null;
};

function formatYmd(ymd: string): string {
  if (ymd.length !== 8) {
    return ymd;
  }

  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

export function ShoplingProductsToolbar({
  search,
  page,
  pageSize,
  totalCount,
  snapshotDate,
}: ShoplingProductsToolbarProps) {
  if (!snapshotDate) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const showPagination = totalCount > 0;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
      <form
        method="GET"
        action="/data/shopling/products"
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Input
          name="q"
          type="search"
          defaultValue={search}
          placeholder="샵플링코드 · 자사상품코드 · 바코드 검색"
          className="min-w-[200px] flex-1 sm:max-w-md"
        />
        <input type="hidden" name="pageSize" value={pageSize} />
        <Button type="submit" size="sm" className="shrink-0">
          조회
        </Button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {formatYmd(snapshotDate)} · {totalCount.toLocaleString()}건
        </p>

        {showPagination ? (
          <div className="flex flex-wrap items-center gap-3">
            <ShoplingPageSizeSelect pageSize={pageSize} search={search} />
            <p className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              {hasPrev ? (
                <Link
                  href={`/data/shopling/products${buildProductsQuery({
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
                  href={`/data/shopling/products${buildProductsQuery({
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

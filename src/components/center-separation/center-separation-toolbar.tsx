import Link from "next/link";

import { buildShoplingListQuery } from "@/components/shopling-data/build-shopling-list-query";
import { DataListToolbarShell } from "@/components/data-list/data-list-toolbar-shell";
import { ShoplingPageSizeSelect } from "@/components/shopling-data/shopling-page-size-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CENTER_SEPARATION_DEFAULT_PAGE_SIZE,
  CENTER_SEPARATION_PAGE_SIZE_OPTIONS,
} from "@/services/center-separation/types";

const BASE_PATH = "/data/coupang-growth/center-separation";

type CenterSeparationToolbarProps = {
  search: string;
  page: number;
  pageSize: number;
  totalCount: number;
  selectedCount?: number;
  onBulkDelete?: () => void;
  isDeleting?: boolean;
};

export function CenterSeparationToolbar({
  search,
  page,
  pageSize,
  totalCount,
  selectedCount = 0,
  onBulkDelete,
  isDeleting = false,
}: CenterSeparationToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const showPagination = totalCount > 0;

  return (
    <DataListToolbarShell>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <form
          method="GET"
          action={BASE_PATH}
          className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center"
        >
          <Input
            name="q"
            type="search"
            defaultValue={search}
            placeholder="바코드 · 상품명 · 옵션명 · 자사상품코드 · 샵플링 옵션 벨류 검색"
            className="min-w-0 flex-1 sm:max-w-md"
          />
          <input type="hidden" name="pageSize" value={pageSize} />
          <Button type="submit" size="sm" className="shrink-0">
            조회
          </Button>
        </form>
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            {totalCount.toLocaleString()}건
          </p>
          {selectedCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {selectedCount.toLocaleString()}건 선택
            </p>
          ) : null}
          {onBulkDelete ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={selectedCount === 0 || isDeleting}
              onClick={onBulkDelete}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          ) : null}
        </div>

        {showPagination ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <ShoplingPageSizeSelect
              basePath={BASE_PATH}
              pageSize={pageSize}
              search={search}
              pageSizeOptions={CENTER_SEPARATION_PAGE_SIZE_OPTIONS}
              defaultPageSize={CENTER_SEPARATION_DEFAULT_PAGE_SIZE}
            />
            <p className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              {hasPrev ? (
                <Link
                  href={`${BASE_PATH}${buildShoplingListQuery({
                    q: search,
                    page: page - 1,
                    pageSize,
                    defaultPageSize: CENTER_SEPARATION_DEFAULT_PAGE_SIZE,
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
                  href={`${BASE_PATH}${buildShoplingListQuery({
                    q: search,
                    page: page + 1,
                    pageSize,
                    defaultPageSize: CENTER_SEPARATION_DEFAULT_PAGE_SIZE,
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
    </DataListToolbarShell>
  );
}

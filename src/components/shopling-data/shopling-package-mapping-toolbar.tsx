import Link from "next/link";

import { buildShoplingListQuery } from "@/components/shopling-data/build-shopling-list-query";
import { ShoplingPackageMappingAddButton } from "@/components/shopling-data/shopling-package-mapping-add-button";
import { ShoplingPageSizeSelect } from "@/components/shopling-data/shopling-page-size-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SHOPLING_PACKAGE_MAPPING_DEFAULT_PAGE_SIZE,
  SHOPLING_PACKAGE_MAPPING_PAGE_SIZE_OPTIONS,
} from "@/services/shopling-package-mapping/types";

const BASE_PATH = "/data/shopling/package-mapping";

type ShoplingPackageMappingToolbarProps = {
  search: string;
  page: number;
  pageSize: number;
  totalCount: number;
  showAddButton?: boolean;
};

export function ShoplingPackageMappingToolbar({
  search,
  page,
  pageSize,
  totalCount,
  showAddButton = false,
}: ShoplingPackageMappingToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const showPagination = totalCount > 0;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          method="GET"
          action={BASE_PATH}
          className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center"
        >
          <Input
            name="q"
            type="search"
            defaultValue={search}
            placeholder="패키지/단품 바코드 · 샵플링코드 · 자사상품코드 · 옵션ID 검색"
            className="min-w-[200px] flex-1 sm:max-w-md"
          />
          <input type="hidden" name="pageSize" value={pageSize} />
          <Button type="submit" size="sm" className="shrink-0">
            조회
          </Button>
        </form>
        {showAddButton ? <ShoplingPackageMappingAddButton /> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount.toLocaleString()}건
        </p>

        {showPagination ? (
          <div className="flex flex-wrap items-center gap-3">
            <ShoplingPageSizeSelect
              basePath={BASE_PATH}
              pageSize={pageSize}
              search={search}
              pageSizeOptions={SHOPLING_PACKAGE_MAPPING_PAGE_SIZE_OPTIONS}
              defaultPageSize={SHOPLING_PACKAGE_MAPPING_DEFAULT_PAGE_SIZE}
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
                    defaultPageSize: SHOPLING_PACKAGE_MAPPING_DEFAULT_PAGE_SIZE,
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
                    defaultPageSize: SHOPLING_PACKAGE_MAPPING_DEFAULT_PAGE_SIZE,
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

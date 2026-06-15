"use client";

import { useRouter } from "next/navigation";

import { buildShoplingListQuery } from "@/components/shopling-data/build-shopling-list-query";

type ShoplingPageSizeSelectProps = {
  basePath: string;
  pageSize: number;
  search: string;
  pageSizeOptions: readonly number[];
  defaultPageSize: number;
};

export function ShoplingPageSizeSelect({
  basePath,
  pageSize,
  search,
  pageSizeOptions,
  defaultPageSize,
}: ShoplingPageSizeSelectProps) {
  const router = useRouter();

  return (
    <select
      value={pageSize}
      aria-label="표시 건수"
      onChange={(event) => {
        const nextPageSize = Number(event.target.value);
        router.push(
          `${basePath}${buildShoplingListQuery({
            q: search,
            page: 1,
            pageSize: nextPageSize,
            defaultPageSize,
          })}`,
        );
      }}
      className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
    >
      {pageSizeOptions.map((size) => (
        <option key={size} value={size}>
          {size}건
        </option>
      ))}
    </select>
  );
}

"use client";

import { useRouter } from "next/navigation";

import { buildProductsQuery } from "@/components/shopling-data/build-products-query";
import { SHOPLING_INVENTORY_PAGE_SIZE_OPTIONS } from "@/services/shopling-data/types";

type ShoplingPageSizeSelectProps = {
  pageSize: number;
  search: string;
};

export function ShoplingPageSizeSelect({
  pageSize,
  search,
}: ShoplingPageSizeSelectProps) {
  const router = useRouter();

  return (
    <select
      value={pageSize}
      aria-label="표시 건수"
      onChange={(event) => {
          const nextPageSize = Number(event.target.value);
          router.push(
            `/data/shopling/products${buildProductsQuery({
              q: search,
              page: 1,
              pageSize: nextPageSize,
            })}`,
          );
        }}
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {SHOPLING_INVENTORY_PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}건
          </option>
        ))}
      </select>
  );
}

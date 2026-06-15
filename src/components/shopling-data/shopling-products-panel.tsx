import Link from "next/link";

import { ShoplingInventoryTable } from "@/components/shopling-data/shopling-inventory-table";
import { ShoplingProductsToolbar } from "@/components/shopling-data/shopling-products-toolbar";
import type { ListShoplingInventoryResult } from "@/services/shopling-data/types";

type ShoplingProductsPanelProps = {
  data: ListShoplingInventoryResult;
  search: string;
  page: number;
  pageSize: number;
};

export function ShoplingProductsPanel({
  data,
  search,
  page,
  pageSize,
}: ShoplingProductsPanelProps) {
  const hasSnapshot = data.snapshotDate !== null;
  const isSearchEmpty = search.trim().length === 0;

  return (
    <div className="space-y-4">
      {hasSnapshot ? (
        <ShoplingProductsToolbar
          search={search}
          page={page}
          pageSize={pageSize}
          totalCount={data.totalCount}
          snapshotDate={data.snapshotDate}
        />
      ) : null}

      {!hasSnapshot ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            조회할 샵플링 재고 데이터가 없습니다.
          </p>
          <p className="mt-2 text-sm">
            <Link
              href="/sync/shopling"
              className="text-primary underline-offset-4 hover:underline"
            >
              데이터 동기화 &gt; 샵플링
            </Link>
            에서 먼저 동기화해 주세요.
          </p>
        </div>
      ) : data.totalCount === 0 && !isSearchEmpty ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      ) : data.totalCount === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            조회할 샵플링 재고 데이터가 없습니다.
          </p>
        </div>
      ) : (
        <ShoplingInventoryTable rows={data.rows} />
      )}
    </div>
  );
}

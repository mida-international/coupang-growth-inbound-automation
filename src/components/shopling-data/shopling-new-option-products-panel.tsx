import Link from "next/link";

import { DataListPanel } from "@/components/data-list/data-list-panel";
import { ShoplingNewOptionProductsTable } from "@/components/shopling-data/shopling-new-option-products-table";
import { ShoplingNewOptionProductsToolbar } from "@/components/shopling-data/shopling-new-option-products-toolbar";
import type { ListNewOptionProductsResult } from "@/services/shopling-data/types";

type ShoplingNewOptionProductsPanelProps = {
  data: ListNewOptionProductsResult;
  search: string;
  page: number;
  pageSize: number;
};

export function ShoplingNewOptionProductsPanel({
  data,
  search,
  page,
  pageSize,
}: ShoplingNewOptionProductsPanelProps) {
  const isSearchEmpty = search.trim().length === 0;

  if (!data.hasInventoryHistory) {
    return (
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
    );
  }

  return (
    <DataListPanel>
      <ShoplingNewOptionProductsToolbar
        search={search}
        page={page}
        pageSize={pageSize}
        totalCount={data.totalCount}
        from={data.from}
        to={data.to}
        days={data.days}
      />

      {data.totalCount === 0 && !isSearchEmpty ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      ) : data.totalCount === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            해당 기간에 신규 옵션 상품이 없습니다.
          </p>
        </div>
      ) : (
        <ShoplingNewOptionProductsTable rows={data.rows} />
      )}
    </DataListPanel>
  );
}

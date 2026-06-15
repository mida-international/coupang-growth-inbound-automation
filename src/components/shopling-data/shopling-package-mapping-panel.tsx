import Link from "next/link";

import { ShoplingPackageMappingTable } from "@/components/shopling-data/shopling-package-mapping-table";
import { ShoplingPackageMappingToolbar } from "@/components/shopling-data/shopling-package-mapping-toolbar";
import type { ListShoplingPackageMappingResult } from "@/services/shopling-package-mapping/types";

type ShoplingPackageMappingPanelProps = {
  data: ListShoplingPackageMappingResult;
  search: string;
  page: number;
  pageSize: number;
};

export function ShoplingPackageMappingPanel({
  data,
  search,
  page,
  pageSize,
}: ShoplingPackageMappingPanelProps) {
  const isSearchEmpty = search.trim().length === 0;
  const hasAnyRows = data.totalCount > 0;
  const dbIsEmpty = !hasAnyRows && isSearchEmpty;

  if (dbIsEmpty) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          조회할 패키지 매핑 데이터가 없습니다.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/sync/shopling"
            className="text-primary underline-offset-4 hover:underline"
          >
            데이터 동기화 &gt; 샵플링
          </Link>
          에서 패키지 매핑 동기화를 먼저 실행해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ShoplingPackageMappingToolbar
        search={search}
        page={page}
        pageSize={pageSize}
        totalCount={data.totalCount}
        showAddButton
      />

      {data.totalCount === 0 && !isSearchEmpty ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <ShoplingPackageMappingTable rows={data.rows} />
      )}
    </div>
  );
}

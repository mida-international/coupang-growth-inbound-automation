import Link from "next/link";
import type { ReactNode } from "react";

import { CoupangGrowthInventoryHealthTable } from "@/components/coupang-growth-data/coupang-growth-inventory-health-table";
import { CoupangGrowthInventoryHealthToolbar } from "@/components/coupang-growth-data/coupang-growth-inventory-health-toolbar";
import { INVENTORY_HEALTH_ALL_SELLERS } from "@/services/coupang-growth-data/resolve-inventory-health-seller-filter";
import type { InventoryHealthSellerFilter } from "@/services/coupang-growth-data/resolve-inventory-health-seller-filter";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import type { ListInventoryHealthResult } from "@/services/coupang-growth-data/types";

type CoupangGrowthInventoryHealthPanelProps = {
  accounts: SellerAccountView[];
  sellerFilter: InventoryHealthSellerFilter;
  data: ListInventoryHealthResult;
  search: string;
  page: number;
  pageSize: number;
};

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
      {children}
    </div>
  );
}

function hasInventoryHealthData(data: ListInventoryHealthResult): boolean {
  return data.hasHealthData;
}

export function CoupangGrowthInventoryHealthPanel({
  accounts,
  sellerFilter,
  data,
  search,
  page,
  pageSize,
}: CoupangGrowthInventoryHealthPanelProps) {
  const hasAccounts = accounts.some((account) => account.isActive);
  const isSearchEmpty = search.trim().length === 0;
  const hasValidSellerFilter =
    sellerFilter === INVENTORY_HEALTH_ALL_SELLERS || sellerFilter.length > 0;

  if (!hasAccounts) {
    return (
      <EmptyState>
        <p className="text-sm text-muted-foreground">
          등록된 쿠팡 판매자 계정이 없습니다.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/data/coupang-growth/seller-accounts"
            className="text-primary underline-offset-4 hover:underline"
          >
            데이터 관리 &gt; 쿠팡 Growth
          </Link>
          에서 먼저 판매자 계정을 등록해 주세요.
        </p>
      </EmptyState>
    );
  }

  if (!hasValidSellerFilter) {
    return (
      <EmptyState>
        <p className="text-sm text-muted-foreground">
          활성화된 쿠팡 판매자 계정이 없습니다.
        </p>
      </EmptyState>
    );
  }

  if (!hasInventoryHealthData(data)) {
    return (
      <>
        <CoupangGrowthInventoryHealthToolbar
          accounts={accounts}
          sellerFilter={sellerFilter}
          search={search}
          page={page}
          pageSize={pageSize}
          totalCount={data.totalCount}
          snapshotDate={data.snapshotDate}
          isAllSellers={data.isAllSellers}
        />
        <EmptyState>
          <p className="text-sm text-muted-foreground">
            조회할 재고 현황 데이터가 없습니다.
          </p>
          <p className="mt-2 text-sm">
            <Link
              href="/sync/coupang-growth/excel-upload"
              className="text-primary underline-offset-4 hover:underline"
            >
              데이터 동기화 &gt; 쿠팡 Growth
            </Link>
            에서 재고 현황 엑셀을 먼저 업로드해 주세요.
          </p>
        </EmptyState>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <CoupangGrowthInventoryHealthToolbar
        accounts={accounts}
        sellerFilter={sellerFilter}
        search={search}
        page={page}
        pageSize={pageSize}
        totalCount={data.totalCount}
        snapshotDate={data.snapshotDate}
        isAllSellers={data.isAllSellers}
      />

      {data.totalCount === 0 && !isSearchEmpty ? (
        <EmptyState>
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        </EmptyState>
      ) : data.totalCount === 0 ? (
        <EmptyState>
          <p className="text-sm text-muted-foreground">
            조회할 재고 현황 데이터가 없습니다.
          </p>
        </EmptyState>
      ) : (
        <CoupangGrowthInventoryHealthTable rows={data.rows} />
      )}
    </div>
  );
}

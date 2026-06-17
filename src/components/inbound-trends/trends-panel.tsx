import Link from "next/link";
import type { ReactNode } from "react";

import { TrendsToolbar } from "@/components/inbound-trends/trends-toolbar";
import { TrendsTable } from "@/components/inbound-trends/trends-table";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import type { ListInboundTrendsResult } from "@/services/inbound-trends/types";

type TrendsPanelProps = {
  accounts: SellerAccountView[];
  sellerId: string;
  data: ListInboundTrendsResult;
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

export function TrendsPanel({
  accounts,
  sellerId,
  data,
  search,
  page,
  pageSize,
}: TrendsPanelProps) {
  const hasAccounts = accounts.some((account) => account.isActive);
  const isSearchEmpty = search.trim().length === 0;

  let emptyContent: ReactNode = null;

  if (!hasAccounts) {
    emptyContent = (
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
  } else if (!sellerId) {
    emptyContent = (
      <EmptyState>
        <p className="text-sm text-muted-foreground">
          활성화된 쿠팡 판매자 계정이 없습니다.
        </p>
      </EmptyState>
    );
  } else if (!data.snapshotDates) {
    emptyContent = (
      <EmptyState>
        <p className="text-sm text-muted-foreground">
          조회할 입고 템플릿 데이터가 없습니다.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/sync/coupang-growth/excel-upload"
            className="text-primary underline-offset-4 hover:underline"
          >
            데이터 동기화 &gt; 쿠팡 Growth
          </Link>
          에서 입고 템플릿을 먼저 업로드해 주세요.
        </p>
      </EmptyState>
    );
  } else if (data.totalCount === 0 && !isSearchEmpty) {
    emptyContent = (
      <EmptyState>
        <p className="text-sm text-muted-foreground">
          검색 조건에 맞는 상품이 없습니다.
        </p>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <TrendsToolbar
        accounts={accounts}
        sellerId={sellerId}
        search={search}
        page={page}
        pageSize={pageSize}
        totalCount={data.totalCount}
        snapshotDates={data.snapshotDates}
        from={data.dateRange.from}
        to={data.dateRange.to}
        days={data.dateRange.days}
      />

      {emptyContent}

      {!emptyContent && data.totalCount > 0 ? (
        <TrendsTable rows={data.rows} dates={data.dates} />
      ) : null}
    </div>
  );
}

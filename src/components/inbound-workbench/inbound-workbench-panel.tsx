import Link from "next/link";
import type { ReactNode } from "react";

import { InboundWorkbenchPanelClient } from "@/components/inbound-workbench/inbound-workbench-panel-client";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import type { ListInboundWorkbenchResult } from "@/services/inbound-workbench/types";
import type { InboundWorkbenchColumnLayout } from "@/services/inbound-workbench/inbound-workbench-column-layout";

type InboundWorkbenchPanelProps = {
  accounts: SellerAccountView[];
  sellerIds: string[];
  data: ListInboundWorkbenchResult;
  search: string;
  page: number;
  pageSize: number;
  sort: string | null;
  dir: string | null;
  columnLayout: InboundWorkbenchColumnLayout;
};

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
      {children}
    </div>
  );
}

export function InboundWorkbenchPanel({
  accounts,
  sellerIds,
  data,
  search,
  page,
  pageSize,
  sort,
  dir,
  columnLayout,
}: InboundWorkbenchPanelProps) {
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
  } else if (sellerIds.length === 0) {
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
        <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
      </EmptyState>
    );
  } else if (data.totalCount === 0) {
    emptyContent = (
      <EmptyState>
        <p className="text-sm text-muted-foreground">
          조회할 입고 작업대 데이터가 없습니다.
        </p>
      </EmptyState>
    );
  }

  return (
    <InboundWorkbenchPanelClient
      accounts={accounts}
      sellerIds={sellerIds}
      data={data}
      search={search}
      page={page}
      pageSize={pageSize}
      sort={sort}
      dir={dir}
      columnLayout={columnLayout}
    >
      {emptyContent}
    </InboundWorkbenchPanelClient>
  );
}

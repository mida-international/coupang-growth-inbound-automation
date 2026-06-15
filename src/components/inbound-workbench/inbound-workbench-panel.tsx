import Link from "next/link";

import { InboundWorkbenchTable } from "@/components/inbound-workbench/inbound-workbench-table";
import { InboundWorkbenchToolbar } from "@/components/inbound-workbench/inbound-workbench-toolbar";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import type { ListInboundWorkbenchResult } from "@/services/inbound-workbench/types";

type InboundWorkbenchPanelProps = {
  accounts: SellerAccountView[];
  sellerId: string;
  data: ListInboundWorkbenchResult;
  search: string;
  page: number;
  pageSize: number;
};

export function InboundWorkbenchPanel({
  accounts,
  sellerId,
  data,
  search,
  page,
  pageSize,
}: InboundWorkbenchPanelProps) {
  const hasAccounts = accounts.some((account) => account.isActive);
  const snapshotDates = data.snapshotDates;
  const isSearchEmpty = search.trim().length === 0;

  if (!hasAccounts) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
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
      </div>
    );
  }

  if (!sellerId) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          활성화된 쿠팡 판매자 계정이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {snapshotDates ? (
        <InboundWorkbenchToolbar
          accounts={accounts}
          sellerId={sellerId}
          search={search}
          page={page}
          pageSize={pageSize}
          totalCount={data.totalCount}
          snapshotDates={snapshotDates}
        />
      ) : null}

      {!snapshotDates ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
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
        </div>
      ) : data.totalCount === 0 && !isSearchEmpty ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      ) : data.totalCount === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            조회할 입고 작업대 데이터가 없습니다.
          </p>
        </div>
      ) : (
        <InboundWorkbenchTable rows={data.rows} />
      )}
    </div>
  );
}

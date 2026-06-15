import Link from "next/link";

import { CoupangInboundTemplateSection } from "@/components/deliverables/coupang-inbound-template-section";
import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { WarehouseInboundListSection } from "@/components/deliverables/warehouse-inbound-list-section";
import { Button } from "@/components/ui/button";
import type { ListWarehouseInboundRowsResult } from "@/services/deliverables/types";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

type DeliverablesPanelProps = {
  accounts: SellerAccountView[];
  sellerId: string;
  warehouseInboundList: ListWarehouseInboundRowsResult;
};

export function DeliverablesPanel({
  accounts,
  sellerId,
  warehouseInboundList,
}: DeliverablesPanelProps) {
  const activeAccounts = accounts.filter((account) => account.isActive);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">산출물 생성</h1>
        <p className="text-muted-foreground">단계별 산출물을 생성합니다.</p>
      </div>

      <DeliverablesSection
        title="쿠팡 판매자 계정"
        description="산출물을 생성할 쿠팡 판매자 계정을 하나 선택합니다."
      >
        {activeAccounts.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              등록된 판매자 계정이 없습니다.
            </p>
            <Button
              render={
                <Link href="/data/coupang-growth/seller-accounts" />
              }
              variant="link"
              className="mt-2 h-auto p-0"
            >
              쿠팡 판매자 계정 관리로 이동
            </Button>
          </div>
        ) : (
          <form
            method="GET"
            action="/downloads"
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <select
              name="seller"
              defaultValue={sellerId}
              aria-label="쿠팡 판매자 계정"
              className="h-9 min-w-[160px] rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.displayName}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" className="shrink-0">
              조회
            </Button>
          </form>
        )}
      </DeliverablesSection>

      <WarehouseInboundListSection
        sellerId={sellerId}
        rowCount={warehouseInboundList.rowCount}
        snapshotDates={warehouseInboundList.snapshotDates}
      />

      <CoupangInboundTemplateSection sellerId={sellerId} />
    </div>
  );
}

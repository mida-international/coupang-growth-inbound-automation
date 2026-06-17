import { InboundWorkbenchPanel } from "@/components/inbound-workbench/inbound-workbench-panel";
import { requireProfile } from "@/lib/auth/profile";
import { resolveSellerAccountId } from "@/services/coupang-seller-accounts/get-default-seller-account-id";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";
import { listInboundWorkbench } from "@/services/inbound-workbench/list-inbound-workbench";
import {
  EMPTY_INBOUND_WORKBENCH_RESULT,
  normalizeInboundWorkbenchPageSize,
} from "@/services/inbound-workbench/types";

type DashboardPageProps = {
  searchParams: Promise<{
    seller?: string;
    q?: string;
    page?: string;
    pageSize?: string;
    sort?: string;
    dir?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  await requireProfile();

  const params = await searchParams;
  const accounts = await listSellerAccounts();
  const sellerId = resolveSellerAccountId(accounts, params.seller);
  const search = params.q?.trim() ?? "";
  const pageSize = normalizeInboundWorkbenchPageSize(Number(params.pageSize));
  const page = Math.max(1, Number(params.page) || 1);

  const data = sellerId
    ? await listInboundWorkbench({
        coupangSellerAccountId: sellerId,
        page,
        pageSize,
        search,
        sort: params.sort,
        dir: params.dir,
      })
    : EMPTY_INBOUND_WORKBENCH_RESULT;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          입고 템플릿 기준으로 쿠팡 재고·샵플링 재고를 조회합니다.
        </p>
      </div>

      <InboundWorkbenchPanel
        accounts={accounts}
        sellerId={sellerId}
        data={data}
        search={search}
        page={page}
        pageSize={pageSize}
        sort={params.sort ?? null}
        dir={params.dir ?? null}
      />
    </div>
  );
}

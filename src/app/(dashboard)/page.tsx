import { InboundWorkbenchPanel } from "@/components/inbound-workbench/inbound-workbench-panel";
import { requireProfile } from "@/lib/auth/profile";
import { resolveSellerAccountIds } from "@/services/coupang-seller-accounts/get-default-seller-account-id";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";
import { listInboundWorkbench } from "@/services/inbound-workbench/list-inbound-workbench";
import { getInboundWorkbenchColumnLayout } from "@/services/inbound-workbench/persist-inbound-workbench-column-layout";
import {
  EMPTY_INBOUND_WORKBENCH_RESULT,
  normalizeInboundWorkbenchPageSize,
} from "@/services/inbound-workbench/types";

type DashboardPageProps = {
  searchParams: Promise<{
    seller?: string | string[];
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
  const profile = await requireProfile();

  const params = await searchParams;
  // 판매자 목록과 컬럼 레이아웃은 서로 독립적이므로 병렬 조회
  // (컬럼 레이아웃을 본 쿼리 뒤에서 순차로 부르던 것을 앞으로 당겨 왕복 제거)
  const [accounts, columnLayout] = await Promise.all([
    listSellerAccounts(),
    getInboundWorkbenchColumnLayout(profile.id),
  ]);
  const sellerIds = resolveSellerAccountIds(accounts, params.seller);
  const search = params.q?.trim() ?? "";
  const pageSize = normalizeInboundWorkbenchPageSize(Number(params.pageSize));
  const page = Math.max(1, Number(params.page) || 1);

  const data =
    sellerIds.length > 0
      ? await listInboundWorkbench({
          coupangSellerAccountIds: sellerIds,
          page,
          pageSize,
          search,
          sort: params.sort,
          dir: params.dir,
        })
      : EMPTY_INBOUND_WORKBENCH_RESULT;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="shrink-0 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          입고 템플릿 기준으로 쿠팡 재고·샵플링 재고를 조회합니다.
        </p>
      </div>

      <InboundWorkbenchPanel
        accounts={accounts}
        sellerIds={sellerIds}
        data={data}
        search={search}
        page={page}
        pageSize={pageSize}
        sort={params.sort ?? null}
        dir={params.dir ?? null}
        columnLayout={columnLayout}
      />
    </div>
  );
}

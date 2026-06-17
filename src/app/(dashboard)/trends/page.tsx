import { TrendsPanel } from "@/components/inbound-trends/trends-panel";
import { requireProfile } from "@/lib/auth/profile";
import { resolveSellerAccountId } from "@/services/coupang-seller-accounts/get-default-seller-account-id";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";
import { listInboundTrends } from "@/services/inbound-trends/list-inbound-trends";
import {
  EMPTY_INBOUND_TRENDS_RESULT,
  normalizeInboundTrendsPageSize,
} from "@/services/inbound-trends/types";

type TrendsPageProps = {
  searchParams: Promise<{
    seller?: string;
    from?: string;
    to?: string;
    days?: string;
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function TrendsPage({ searchParams }: TrendsPageProps) {
  await requireProfile();

  const params = await searchParams;
  const accounts = await listSellerAccounts();
  const sellerId = resolveSellerAccountId(accounts, params.seller);
  const search = params.q?.trim() ?? "";
  const pageSize = normalizeInboundTrendsPageSize(Number(params.pageSize));
  const page = Math.max(1, Number(params.page) || 1);

  const data = sellerId
    ? await listInboundTrends({
        coupangSellerAccountId: sellerId,
        from: params.from,
        to: params.to,
        days: params.days,
        page,
        pageSize,
        search,
      })
    : EMPTY_INBOUND_TRENDS_RESULT;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">추세조회</h1>
        <p className="text-muted-foreground">
          쿠팡 입고 기록(완)과 창고전송용 입고리스트 기록을 날짜별로
          비교합니다.
        </p>
      </div>

      <TrendsPanel
        accounts={accounts}
        sellerId={sellerId}
        data={data}
        search={search}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}

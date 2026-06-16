import { CoupangGrowthInventoryHealthPanel } from "@/components/coupang-growth-data/coupang-growth-inventory-health-panel";
import { requireProfile } from "@/lib/auth/profile";
import { resolveSellerAccountId } from "@/services/coupang-seller-accounts/get-default-seller-account-id";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";
import { listInventoryHealth } from "@/services/coupang-growth-data/list-inventory-health";
import {
  EMPTY_INVENTORY_HEALTH_RESULT,
  normalizeInventoryHealthPageSize,
} from "@/services/coupang-growth-data/types";

type CoupangGrowthInventoryHealthPageProps = {
  searchParams: Promise<{
    seller?: string;
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function CoupangGrowthInventoryHealthPage({
  searchParams,
}: CoupangGrowthInventoryHealthPageProps) {
  await requireProfile();

  const params = await searchParams;
  const accounts = await listSellerAccounts();
  const sellerId = resolveSellerAccountId(accounts, params.seller);
  const search = params.q?.trim() ?? "";
  const pageSize = normalizeInventoryHealthPageSize(Number(params.pageSize));
  const page = Math.max(1, Number(params.page) || 1);

  const data = sellerId
    ? await listInventoryHealth({
        coupangSellerAccountId: sellerId,
        page,
        pageSize,
        search,
      })
    : EMPTY_INVENTORY_HEALTH_RESULT;

  return (
    <CoupangGrowthInventoryHealthPanel
      accounts={accounts}
      sellerId={sellerId}
      data={data}
      search={search}
      page={page}
      pageSize={pageSize}
    />
  );
}

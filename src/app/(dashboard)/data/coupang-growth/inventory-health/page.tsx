import { CoupangGrowthInventoryHealthPanel } from "@/components/coupang-growth-data/coupang-growth-inventory-health-panel";
import { requireProfile } from "@/lib/auth/profile";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";
import { listInventoryHealth } from "@/services/coupang-growth-data/list-inventory-health";
import { resolveInventoryHealthSellerFilter } from "@/services/coupang-growth-data/resolve-inventory-health-seller-filter";
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
  const sellerFilter = resolveInventoryHealthSellerFilter(accounts, params.seller);
  const search = params.q?.trim() ?? "";
  const pageSize = normalizeInventoryHealthPageSize(Number(params.pageSize));
  const page = Math.max(1, Number(params.page) || 1);
  const hasActiveAccounts = accounts.some((account) => account.isActive);

  const data = hasActiveAccounts
    ? await listInventoryHealth({
        sellerFilter,
        page,
        pageSize,
        search,
      })
    : EMPTY_INVENTORY_HEALTH_RESULT;

  return (
    <CoupangGrowthInventoryHealthPanel
      accounts={accounts}
      sellerFilter={sellerFilter}
      data={data}
      search={search}
      page={page}
      pageSize={pageSize}
    />
  );
}

import { DeliverablesPanel } from "@/components/deliverables/deliverables-panel";
import { requireProfile } from "@/lib/auth/profile";
import { resolveExplicitSellerAccountId } from "@/services/coupang-seller-accounts/get-default-seller-account-id";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";
import { listWarehouseInboundRows } from "@/services/deliverables/list-warehouse-inbound-rows";

type CoupangGrowthInboundPageProps = {
  searchParams: Promise<{ seller?: string }>;
};

export default async function CoupangGrowthInboundPage({
  searchParams,
}: CoupangGrowthInboundPageProps) {
  await requireProfile();

  const params = await searchParams;
  const accounts = await listSellerAccounts();
  const sellerId = resolveExplicitSellerAccountId(accounts, params.seller);
  const warehouseInboundList = sellerId
    ? await listWarehouseInboundRows({ coupangSellerAccountId: sellerId })
    : { snapshotDates: null, rowCount: 0, rows: [] };

  return (
    <DeliverablesPanel
      accounts={accounts}
      sellerId={sellerId}
      warehouseInboundList={warehouseInboundList}
    />
  );
}

import { CoupangInboundTemplateSection } from "@/components/deliverables/coupang-inbound-template-section";
import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { DeliverablesSellerAccountPicker } from "@/components/deliverables/deliverables-seller-account-picker";
import { ShoplingOutboundTemplateSection } from "@/components/deliverables/shopling-outbound-template-section";
import { WarehouseInboundListSection } from "@/components/deliverables/warehouse-inbound-list-section";
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
      <DeliverablesSection
        title="쿠팡 판매자 계정"
        description="산출물을 생성할 쿠팡 판매자 계정을 고른 뒤 선택을 누르세요."
      >
        <DeliverablesSellerAccountPicker
          key={sellerId}
          accounts={activeAccounts}
          selectedSellerId={sellerId}
        />
      </DeliverablesSection>

      <WarehouseInboundListSection
        sellerId={sellerId}
        rowCount={warehouseInboundList.rowCount}
        snapshotDates={warehouseInboundList.snapshotDates}
      />

      <CoupangInboundTemplateSection sellerId={sellerId} />

      <ShoplingOutboundTemplateSection sellerId={sellerId} />
    </div>
  );
}

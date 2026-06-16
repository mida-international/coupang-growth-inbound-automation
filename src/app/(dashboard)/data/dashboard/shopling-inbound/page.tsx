import { InboundListManagementPanel } from "@/components/deliverables/inbound-list-management-panel";
import { ShoplingInboundRecordHistorySection } from "@/components/deliverables/shopling-inbound-record-history-section";
import { requireProfile } from "@/lib/auth/profile";
import { listShoplingInboundDeliverables } from "@/services/deliverables/list-shopling-inbound-deliverables";
import { normalizeShoplingInboundDeliverablePageSize } from "@/services/deliverables/types";

type DashboardShoplingInboundPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function DashboardShoplingInboundPage({
  searchParams,
}: DashboardShoplingInboundPageProps) {
  await requireProfile();

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = normalizeShoplingInboundDeliverablePageSize(
    Number(params.pageSize),
  );
  const history = await listShoplingInboundDeliverables({ page, pageSize });

  return (
    <div className="space-y-6">
      <InboundListManagementPanel />
      <ShoplingInboundRecordHistorySection data={history} />
    </div>
  );
}

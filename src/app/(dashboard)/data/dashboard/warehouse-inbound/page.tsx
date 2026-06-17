import { WarehouseInboundRecordHistorySection } from "@/components/deliverables/warehouse-inbound-record-history-section";
import { requireProfile } from "@/lib/auth/profile";
import { listWarehouseInboundDeliverables } from "@/services/deliverables/list-warehouse-inbound-deliverables";
import { normalizeShoplingInboundDeliverablePageSize } from "@/services/deliverables/types";

type DashboardWarehouseInboundPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function DashboardWarehouseInboundPage({
  searchParams,
}: DashboardWarehouseInboundPageProps) {
  await requireProfile();

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = normalizeShoplingInboundDeliverablePageSize(
    Number(params.pageSize),
  );
  const history = await listWarehouseInboundDeliverables({ page, pageSize });

  return <WarehouseInboundRecordHistorySection data={history} />;
}

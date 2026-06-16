import { InboundListManagementPanel } from "@/components/deliverables/inbound-list-management-panel";
import { requireProfile } from "@/lib/auth/profile";

export default async function DashboardShoplingInboundPage() {
  await requireProfile();

  return <InboundListManagementPanel />;
}

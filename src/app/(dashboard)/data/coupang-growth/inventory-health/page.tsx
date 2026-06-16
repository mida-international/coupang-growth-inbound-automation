import { CoupangGrowthInventoryHealthPanel } from "@/components/coupang-growth-data/coupang-growth-inventory-health-panel";
import { requireProfile } from "@/lib/auth/profile";

export default async function CoupangGrowthInventoryHealthPage() {
  await requireProfile();

  return <CoupangGrowthInventoryHealthPanel />;
}

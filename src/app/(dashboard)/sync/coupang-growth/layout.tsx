import { PageTabsNav } from "@/components/layout/page-tabs-nav";
import { coupangGrowthSyncTabGroup } from "@/config/page-tabs";

export default function CoupangGrowthSyncLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageTabsNav
        tabs={coupangGrowthSyncTabGroup.tabs}
        className="-mx-4 px-4"
      />
      {children}
    </div>
  );
}

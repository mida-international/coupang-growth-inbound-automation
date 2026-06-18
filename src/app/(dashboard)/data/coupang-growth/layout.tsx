import { PageTabsNav } from "@/components/layout/page-tabs-nav";
import { coupangGrowthTabGroup } from "@/config/page-tabs";

export default function CoupangGrowthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageTabsNav
        tabs={coupangGrowthTabGroup.tabs}
        className="-mx-4 shrink-0 px-4"
      />
      <div className="flex min-w-0 flex-col">{children}</div>
    </div>
  );
}

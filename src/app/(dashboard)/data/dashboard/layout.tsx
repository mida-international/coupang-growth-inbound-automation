import { PageTabsNav } from "@/components/layout/page-tabs-nav";
import { dashboardTabGroup } from "@/config/page-tabs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageTabsNav tabs={dashboardTabGroup.tabs} className="-mx-4 px-4" />
      {children}
    </div>
  );
}

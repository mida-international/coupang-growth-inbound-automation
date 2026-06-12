import { PageTabsNav } from "@/components/layout/page-tabs-nav";
import { integrationsTabGroup } from "@/config/page-tabs";

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageTabsNav
        tabs={integrationsTabGroup.tabs}
        className="-mx-4 px-4"
      />
      {children}
    </div>
  );
}

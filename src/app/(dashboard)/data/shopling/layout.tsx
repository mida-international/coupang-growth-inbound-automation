import { PageTabsNav } from "@/components/layout/page-tabs-nav";
import { shoplingDataTabGroup } from "@/config/page-tabs";

export default function ShoplingDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageTabsNav tabs={shoplingDataTabGroup.tabs} className="-mx-4 px-4" />
      {children}
    </div>
  );
}

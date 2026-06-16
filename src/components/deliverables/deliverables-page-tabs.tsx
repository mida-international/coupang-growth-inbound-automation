import { PageTabsNav } from "@/components/layout/page-tabs-nav";
import { deliverablesTabGroup } from "@/config/page-tabs";

type DeliverablesPageTabsProps = {
  children: React.ReactNode;
};

export function DeliverablesPageTabs({ children }: DeliverablesPageTabsProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageTabsNav tabs={deliverablesTabGroup.tabs} className="-mx-4 px-4" />
      <div className="space-y-6">{children}</div>
    </div>
  );
}

import { PageTabsNav } from "@/components/layout/page-tabs-nav";
import { boardWorkflowTabGroup } from "@/config/page-tabs";

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageTabsNav tabs={boardWorkflowTabGroup.tabs} className="-mx-4 px-4" />
      {children}
    </div>
  );
}

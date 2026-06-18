import { PageTabsNav } from "@/components/layout/page-tabs-nav";
import { deliverablesTabGroup } from "@/config/page-tabs";

export default function DownloadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageTabsNav
        tabs={deliverablesTabGroup.tabs}
        className="-mx-4 px-4"
        equalWidth
      />
      {children}
    </div>
  );
}

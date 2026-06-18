import { notFound, redirect } from "next/navigation";

import { PageTabsNav } from "@/components/layout/page-tabs-nav";
import { boardCategoryTabGroup } from "@/config/page-tabs";
import { isBoardCategorySlug } from "@/data/board/categories";
import { isBoardWorkflowSlug } from "@/data/board/workflows";

type BoardWorkflowLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ workflow: string }>;
};

export default async function BoardWorkflowLayout({
  children,
  params,
}: BoardWorkflowLayoutProps) {
  const { workflow } = await params;

  if (isBoardCategorySlug(workflow) && !isBoardWorkflowSlug(workflow)) {
    const tab = boardCategoryTabGroup.tabs.find((item) =>
      item.href.endsWith(`/${workflow}`),
    );
    redirect(tab?.href ?? boardCategoryTabGroup.tabs[0]?.href ?? "/board");
  }

  if (!isBoardWorkflowSlug(workflow)) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTabsNav tabs={boardCategoryTabGroup.tabs} className="-mx-4 px-4" />
      {children}
    </div>
  );
}

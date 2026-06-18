import { redirect } from "next/navigation";

import {
  boardCategoryTabGroup,
  getDefaultTabHref,
} from "@/config/page-tabs";
import { isBoardWorkflowSlug } from "@/data/board/workflows";

type BoardWorkflowPageProps = {
  params: Promise<{ workflow: string }>;
};

export default async function BoardWorkflowPage({
  params,
}: BoardWorkflowPageProps) {
  const { workflow } = await params;

  if (!isBoardWorkflowSlug(workflow)) {
    redirect("/board");
  }

  redirect(getDefaultTabHref(boardCategoryTabGroup));
}

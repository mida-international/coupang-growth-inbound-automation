import { notFound } from "next/navigation";

import { BoardThreadList } from "@/components/board/board-thread-list";
import {
  isBoardCategorySlug,
  type BoardCategorySlug,
} from "@/data/board/categories";
import { isBoardWorkflowSlug } from "@/data/board/workflows";
import { requireProfile } from "@/lib/auth/profile";

type BoardCategoryPageProps = {
  params: Promise<{ workflow: string; category: string }>;
};

export default async function BoardCategoryPage({
  params,
}: BoardCategoryPageProps) {
  await requireProfile();

  const { workflow, category } = await params;

  if (!isBoardWorkflowSlug(workflow) || !isBoardCategorySlug(category)) {
    notFound();
  }

  return <BoardThreadList categorySlug={category as BoardCategorySlug} />;
}

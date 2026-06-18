import { BoardThreadCollapsibleItem } from "@/components/board/board-thread-collapsible-item";
import {
  boardCategorySlugLabels,
  getBoardCategoryFromSlug,
  type BoardCategorySlug,
} from "@/data/board/categories";
import { boardThreads } from "@/data/board/communication-posts";

type BoardThreadListProps = {
  categorySlug: BoardCategorySlug;
};

function sortThreads(
  threads: typeof boardThreads,
): typeof boardThreads {
  return [...threads].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    const aCreatedAt = a.messages[0]?.createdAt ?? "";
    const bCreatedAt = b.messages[0]?.createdAt ?? "";
    return bCreatedAt.localeCompare(aCreatedAt);
  });
}

export function BoardThreadList({ categorySlug }: BoardThreadListProps) {
  const category = getBoardCategoryFromSlug(categorySlug);
  const filteredThreads =
    category === null
      ? boardThreads
      : boardThreads.filter((thread) => thread.category === category);
  const threads = sortThreads(filteredThreads);
  const label = boardCategorySlugLabels[categorySlug];

  if (threads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        {label} 카테고리에 게시글이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">총 {threads.length}건</p>
      <div className="flex flex-col gap-2">
        {threads.map((thread) => (
          <BoardThreadCollapsibleItem
            key={`${thread.category}-${thread.title}-${thread.messages[0]?.createdAt ?? ""}`}
            thread={thread}
          />
        ))}
      </div>
    </div>
  );
}

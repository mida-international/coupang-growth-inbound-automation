import type { BoardCategory } from "@/data/board/communication-posts";

export type BoardCategorySlug =
  | "all"
  | "notice"
  | "bug"
  | "request"
  | "general";

export const boardCategorySlugs: BoardCategorySlug[] = [
  "all",
  "notice",
  "bug",
  "request",
  "general",
];

export const boardCategorySlugLabels: Record<BoardCategorySlug, string> = {
  all: "전체",
  notice: "공지",
  bug: "버그/오류",
  request: "요청사항",
  general: "일반",
};

export const boardCategoryBySlug: Record<
  Exclude<BoardCategorySlug, "all">,
  BoardCategory
> = {
  notice: "공지",
  bug: "버그/오류",
  request: "요청사항",
  general: "일반",
};

export function isBoardCategorySlug(value: string): value is BoardCategorySlug {
  return (boardCategorySlugs as string[]).includes(value);
}

export function getBoardCategoryFromSlug(
  slug: BoardCategorySlug,
): BoardCategory | null {
  if (slug === "all") {
    return null;
  }

  return boardCategoryBySlug[slug];
}

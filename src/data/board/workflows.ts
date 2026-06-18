export type BoardWorkflowSlug = "legacy-dashboard";

export const boardWorkflowSlugs: BoardWorkflowSlug[] = ["legacy-dashboard"];

export const boardWorkflowLabels: Record<BoardWorkflowSlug, string> = {
  "legacy-dashboard": "구 대시보드 작업흐름",
};

export function isBoardWorkflowSlug(
  value: string,
): value is BoardWorkflowSlug {
  return (boardWorkflowSlugs as string[]).includes(value);
}

export function getBoardWorkflowBasePath(workflow: BoardWorkflowSlug) {
  return `/board/${workflow}`;
}

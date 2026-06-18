import type { ReactNode } from "react";

export function DataListPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">{children}</div>
  );
}

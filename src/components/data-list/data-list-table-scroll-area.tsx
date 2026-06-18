import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DataListTableScrollAreaProps = {
  children: ReactNode;
  className?: string;
};

export function DataListTableScrollArea({
  children,
  className,
}: DataListTableScrollAreaProps) {
  return (
    <div
      className={cn(
        "h-[var(--list-table-height)] max-h-[var(--list-table-height)] min-h-[var(--list-table-height)] min-w-0 shrink-0 overflow-auto overscroll-contain rounded-md border border-border bg-background",
        className,
      )}
    >
      {children}
    </div>
  );
}

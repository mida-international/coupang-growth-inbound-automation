import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DataListToolbarShellProps = {
  children: ReactNode;
  className?: string;
};

export function DataListToolbarShell({
  children,
  className,
}: DataListToolbarShellProps) {
  return (
    <div
      className={cn(
        "w-full min-w-0 shrink-0 space-y-3 overflow-hidden rounded-lg border border-border bg-muted/30 px-3 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

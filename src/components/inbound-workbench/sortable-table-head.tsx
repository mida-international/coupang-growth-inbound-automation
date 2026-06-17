"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { TableHead } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  InboundWorkbenchSortColumn,
  InboundWorkbenchSortDirection,
} from "@/services/inbound-workbench/inbound-workbench-sort";

type SortableTableHeadProps = {
  column: InboundWorkbenchSortColumn;
  label: string;
  sort: InboundWorkbenchSortColumn | null;
  dir: InboundWorkbenchSortDirection | null;
  onSort: (column: InboundWorkbenchSortColumn) => void;
  disabled?: boolean;
  align?: "left" | "right";
  className?: string;
  tooltip?: ReactNode;
};

function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir: InboundWorkbenchSortDirection | null;
}) {
  if (!active || !dir) {
    return <ArrowUpDown className="size-3.5 shrink-0 opacity-50" />;
  }

  if (dir === "desc") {
    return <ArrowDown className="size-3.5 shrink-0" />;
  }

  return <ArrowUp className="size-3.5 shrink-0" />;
}

export function SortableTableHead({
  column,
  label,
  sort,
  dir,
  onSort,
  disabled = false,
  align = "left",
  className,
  tooltip,
}: SortableTableHeadProps) {
  const isActive = sort === column;

  return (
    <TableHead
      className={cn(align === "right" && "text-right", className)}
    >
      <div
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "justify-end",
        )}
      >
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-4">
              {label}
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm text-left">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        ) : (
          <span>{label}</span>
        )}
        <button
          type="button"
          disabled={disabled}
          aria-label={`${label} 정렬`}
          className={cn(
            "inline-flex items-center rounded-sm p-0.5 text-foreground/80 transition-colors",
            "hover:bg-muted hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-40",
            isActive && "text-foreground",
          )}
          onClick={() => onSort(column)}
        >
          <SortIcon active={isActive} dir={isActive ? dir : null} />
        </button>
      </div>
    </TableHead>
  );
}

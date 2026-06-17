"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical } from "lucide-react";
import { useCallback, useRef, type DragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

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
import { INBOUND_WORKBENCH_SORT_COLUMNS } from "@/services/inbound-workbench/inbound-workbench-sort";

type WorkbenchColumnHeadProps = {
  column: InboundWorkbenchSortColumn;
  label: string;
  width: number;
  sort: InboundWorkbenchSortColumn | null;
  dir: InboundWorkbenchSortDirection | null;
  onSort: (column: InboundWorkbenchSortColumn) => void;
  onReorder: (fromId: InboundWorkbenchSortColumn, toId: InboundWorkbenchSortColumn) => void;
  onResize: (column: InboundWorkbenchSortColumn, width: number) => void;
  disabled?: boolean;
  layoutDisabled?: boolean;
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

export function WorkbenchColumnHead({
  column,
  label,
  width,
  sort,
  dir,
  onSort,
  onReorder,
  onResize,
  disabled = false,
  layoutDisabled = false,
  align = "left",
  className,
  tooltip,
}: WorkbenchColumnHeadProps) {
  const isActive = sort === column;
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(width);

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    if (layoutDisabled) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", column);
  };

  const handleDragOver = (event: DragEvent<HTMLTableCellElement>) => {
    if (layoutDisabled) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: DragEvent<HTMLTableCellElement>) => {
    if (layoutDisabled) {
      return;
    }

    event.preventDefault();
    const fromId = event.dataTransfer.getData("text/plain");

    if (
      fromId &&
      fromId !== column &&
      INBOUND_WORKBENCH_SORT_COLUMN_SET.has(fromId)
    ) {
      onReorder(fromId as InboundWorkbenchSortColumn, column);
    }
  };

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (layoutDisabled) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      resizeStartX.current = event.clientX;
      resizeStartWidth.current = width;

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const delta = moveEvent.clientX - resizeStartX.current;
        onResize(column, resizeStartWidth.current + delta);
      };

      const handlePointerUp = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [column, layoutDisabled, onResize, width],
  );

  return (
    <TableHead
      className={cn(
        "relative select-none p-0",
        align === "right" && "text-right",
        className,
      )}
      style={{ width, minWidth: width, maxWidth: width }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          "flex h-10 items-center gap-0.5 px-2",
          align === "right" && "justify-end",
        )}
      >
        <button
          type="button"
          draggable={!layoutDisabled}
          disabled={layoutDisabled}
          aria-label={`${label} 열 이동`}
          className={cn(
            "inline-flex shrink-0 cursor-grab items-center rounded-sm p-0.5 text-muted-foreground",
            "hover:bg-muted hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-40",
            "active:cursor-grabbing",
          )}
          onDragStart={handleDragStart}
        >
          <GripVertical className="size-3.5" />
        </button>

        <div
          className={cn(
            "inline-flex min-w-0 flex-1 items-center gap-1",
            align === "right" && "justify-end",
          )}
        >
          {tooltip ? (
            <Tooltip>
              <TooltipTrigger className="cursor-help truncate underline decoration-dotted underline-offset-4">
                {label}
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm text-left">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="truncate">{label}</span>
          )}
          <button
            type="button"
            disabled={disabled}
            aria-label={`${label} 정렬`}
            className={cn(
              "inline-flex shrink-0 items-center rounded-sm p-0.5 text-foreground/80 transition-colors",
              "hover:bg-muted hover:text-foreground",
              "disabled:pointer-events-none disabled:opacity-40",
              isActive && "text-foreground",
            )}
            onClick={() => onSort(column)}
          >
            <SortIcon active={isActive} dir={isActive ? dir : null} />
          </button>
        </div>
      </div>

      {!layoutDisabled ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={`${label} 열 너비 조절`}
          className="absolute inset-y-0 right-0 z-10 w-1 cursor-col-resize touch-none hover:bg-primary/30"
          onPointerDown={handleResizePointerDown}
        />
      ) : null}
    </TableHead>
  );
}

const INBOUND_WORKBENCH_SORT_COLUMN_SET = new Set<string>(
  INBOUND_WORKBENCH_SORT_COLUMNS,
);

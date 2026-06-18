"use client";

import { Columns3 } from "lucide-react";

import { getInboundWorkbenchColumnDef } from "@/components/inbound-workbench/inbound-workbench-columns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InboundWorkbenchSortColumn } from "@/services/inbound-workbench/inbound-workbench-sort";

type WorkbenchColumnVisibilityMenuProps = {
  columnOrder: InboundWorkbenchSortColumn[];
  isColumnHidden: (columnId: InboundWorkbenchSortColumn) => boolean;
  onColumnHiddenChange: (
    columnId: InboundWorkbenchSortColumn,
    hidden: boolean,
  ) => void;
  disabled?: boolean;
};

export function WorkbenchColumnVisibilityMenu({
  columnOrder,
  isColumnHidden,
  onColumnHiddenChange,
  disabled = false,
}: WorkbenchColumnVisibilityMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
          />
        }
      >
        <Columns3 className="size-4" />
        열 숨김
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>체크한 열은 숨깁니다</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-80 overflow-y-auto">
          {columnOrder.map((columnId) => {
            const def = getInboundWorkbenchColumnDef(columnId);

            return (
              <DropdownMenuCheckboxItem
                key={columnId}
                checked={isColumnHidden(columnId)}
                onCheckedChange={(checked) =>
                  onColumnHiddenChange(columnId, checked === true)
                }
              >
                {def.label}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

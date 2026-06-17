"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

type SellerAccountCheckboxListProps = {
  accounts: SellerAccountView[];
  selectedIds: string[];
  appliedIds: string[];
  disabled?: boolean;
  onChange: (nextIds: string[]) => void;
};

export function SellerAccountCheckboxList({
  accounts,
  selectedIds,
  appliedIds,
  disabled = false,
  onChange,
}: SellerAccountCheckboxListProps) {
  const activeAccounts = accounts.filter((account) => account.isActive);
  const appliedSet = new Set(appliedIds);

  function toggleAccount(accountId: string, checked: boolean) {
    if (disabled) {
      return;
    }

    if (checked) {
      if (!selectedIds.includes(accountId)) {
        onChange([...selectedIds, accountId]);
      }
      return;
    }

    if (selectedIds.length <= 1) {
      return;
    }

    onChange(selectedIds.filter((id) => id !== accountId));
  }

  if (activeAccounts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
        등록된 활성 판매자 계정이 없습니다.
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="쿠팡 판매자 계정"
    >
      {activeAccounts.map((account) => {
        const checked = selectedIds.includes(account.id);
        const isApplied = appliedSet.has(account.id);
        const isPending = checked && !isApplied;
        const isLocked = checked && selectedIds.length === 1;

        return (
          <label
            key={account.id}
            className={cn(
              "flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
              disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:border-muted-foreground/40",
              checked && isApplied && !isPending &&
                "border-primary/50 bg-primary/5 shadow-sm",
              isPending &&
                "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20",
              !checked &&
                "border-border bg-background",
            )}
          >
            <Checkbox
              checked={checked}
              disabled={disabled || isLocked}
              onCheckedChange={(nextChecked) =>
                toggleAccount(account.id, nextChecked === true)
              }
            />
            <span
              className={cn(
                "min-w-0 truncate",
                checked ? "font-medium text-foreground" : "text-muted-foreground",
              )}
              title={account.displayName}
            >
              {account.displayName}
            </span>
            {isPending ? (
              <span className="ml-auto shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                미적용
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}

export function areSellerSelectionsEqual(
  left: string[],
  right: string[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

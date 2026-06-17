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
      <p className="text-sm text-muted-foreground">판매자 계정 없음</p>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-x-4 gap-y-2"
      aria-label="쿠팡 판매자 계정"
    >
      {activeAccounts.map((account) => {
        const checked = selectedIds.includes(account.id);
        const isApplied = appliedSet.has(account.id);

        return (
          <label
            key={account.id}
            className={cn(
              "inline-flex items-center gap-2 text-sm",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
          >
            <Checkbox
              checked={checked}
              disabled={disabled || (checked && selectedIds.length === 1)}
              onCheckedChange={(nextChecked) =>
                toggleAccount(account.id, nextChecked === true)
              }
            />
            <span
              className={cn(
                isApplied && checked
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {account.displayName}
            </span>
          </label>
        );
      })}
    </div>
  );
}

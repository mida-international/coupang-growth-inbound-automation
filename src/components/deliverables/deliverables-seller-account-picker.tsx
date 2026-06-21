"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

type DeliverablesSellerAccountPickerProps = {
  accounts: SellerAccountView[];
  selectedSellerId: string;
};

export function DeliverablesSellerAccountPicker({
  accounts,
  selectedSellerId,
}: DeliverablesSellerAccountPickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftAccountId, setDraftAccountId] = useState(selectedSellerId);

  const draftAccount = accounts.find((account) => account.id === draftAccountId);
  const appliedAccount = accounts.find(
    (account) => account.id === selectedSellerId,
  );
  const hasPendingAccountChange = draftAccountId !== selectedSellerId;
  const canApply = draftAccountId.trim().length > 0 && hasPendingAccountChange;

  function handleApplyAccount() {
    if (!canApply || isPending) {
      return;
    }

    startTransition(() => {
      router.push(
        `/downloads/coupang-growth-inbound?seller=${encodeURIComponent(draftAccountId)}`,
      );
    });
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          등록된 판매자 계정이 없습니다.
        </p>
        <Button
          render={<Link href="/data/coupang-growth/seller-accounts" />}
          variant="link"
          className="mt-2 h-auto p-0"
        >
          쿠팡 판매자 계정 관리로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={draftAccountId || undefined}
          disabled={isPending}
          onValueChange={(value) => {
            if (value) {
              setDraftAccountId(value);
            }
          }}
        >
          <SelectTrigger
            id="deliverables-seller-account"
            className="h-9 w-full min-w-[12rem] max-w-sm bg-background"
            aria-label="쿠팡 판매자 계정"
            disabled={isPending}
          >
            <span
              className={cn(
                "truncate",
                !draftAccount && "text-muted-foreground",
              )}
            >
              {draftAccount?.displayName ?? "판매자 계정 선택"}
            </span>
          </SelectTrigger>
          <SelectContent align="start">
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          className="h-9 shrink-0 px-5"
          variant={hasPendingAccountChange ? "default" : "outline"}
          disabled={!canApply || isPending}
          onClick={handleApplyAccount}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              적용 중...
            </>
          ) : (
            "선택"
          )}
        </Button>
      </div>
      {isPending ? (
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          계정 정보를 불러오는 중입니다...
        </p>
      ) : null}
      {appliedAccount ? (
        <p className="text-xs text-muted-foreground">
          적용된 계정:{" "}
          <span className="font-medium text-foreground">
            {appliedAccount.displayName}
          </span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          계정을 고른 뒤 선택을 눌러야 산출물 작업을 시작할 수 있습니다.
        </p>
      )}
      {hasPendingAccountChange && draftAccountId ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          계정 선택이 변경되었습니다. 적용하려면 선택을 누르세요.
        </p>
      ) : null}
    </div>
  );
}

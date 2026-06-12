import type { ReactNode } from "react";

import { AddSellerAccountForm } from "@/components/coupang-seller-accounts/add-seller-account-form";
import { SellerAccountsTable } from "@/components/coupang-seller-accounts/seller-accounts-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

function SellerAccountsSection({
  title,
  description,
  action,
  children,
  variant = "muted",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  variant?: "muted" | "plain";
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border p-4 sm:p-5",
        variant === "muted" ? "bg-muted/50" : "bg-background",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-4 w-1 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SellerAccountsPanel({
  accounts,
}: {
  accounts: SellerAccountView[];
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle>쿠팡 판매자 계정</CardTitle>
        <CardDescription>
          쿠팡 Wing 판매자 계정을 등록하고 목록을 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 bg-muted/15 p-(--card-spacing)">
        <SellerAccountsSection
          title="계정 추가"
          description="새 쿠팡 판매자 계정을 등록합니다."
          variant="muted"
        >
          <AddSellerAccountForm />
        </SellerAccountsSection>
        <SellerAccountsSection
          title="계정 목록"
          description="등록된 쿠팡 판매자 계정입니다."
          variant="plain"
          action={
            <Badge variant="secondary" className="shrink-0">
              {accounts.length}건
            </Badge>
          }
        >
          <SellerAccountsTable accounts={accounts} />
        </SellerAccountsSection>
      </CardContent>
    </Card>
  );
}

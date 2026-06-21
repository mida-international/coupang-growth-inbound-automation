"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiDelete } from "@/lib/api-client";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

function creatorLabel(account: SellerAccountView) {
  return account.createdBy.name ?? account.createdBy.email;
}

export function SellerAccountsTable({
  accounts,
}: {
  accounts: SellerAccountView[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (accounts.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          등록된 판매자 계정이 없습니다.
        </p>
      </div>
    );
  }

  async function handleDelete(account: SellerAccountView) {
    const confirmed = window.confirm(
      `"${account.displayName}" 계정을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setDeletingId(account.id);

    const result = await apiDelete<void>(
      `/api/coupang-seller-accounts/${account.id}`,
    );

    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-md border border-border bg-background">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead>쿠팡 판매자 계정</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>생성자</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{account.displayName}</TableCell>
                <TableCell>
                  <Badge variant={account.isActive ? "default" : "secondary"}>
                    {account.isActive ? "활성" : "비활성"}
                  </Badge>
                </TableCell>
                <TableCell>{creatorLabel(account)}</TableCell>
                <TableCell>{formatDate(account.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === account.id}
                    onClick={() => handleDelete(account)}
                  >
                    {deletingId === account.id ? "삭제 중..." : "삭제"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

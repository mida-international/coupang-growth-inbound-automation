import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        등록된 판매자 계정이 없습니다.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>표시명</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>생성자</TableHead>
          <TableHead>생성일</TableHead>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

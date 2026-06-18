import {
  generateSimpleListBuffer,
  type SimpleListColumn,
} from "@/lib/excel/generators/simple-list-export";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

const COLUMNS: SimpleListColumn[] = [
  { key: "displayName", header: "쿠팡 판매자 계정" },
  { key: "status", header: "상태" },
  { key: "creator", header: "생성자" },
  { key: "createdAt", header: "생성일" },
];

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

export function buildSellerAccountsFilename(): string {
  return `판매자계정_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

export function generateSellerAccountsBuffer(
  accounts: SellerAccountView[],
): Buffer {
  return generateSimpleListBuffer({
    sheetName: "판매자계정",
    columns: COLUMNS,
    rows: accounts.map((account) => ({
      displayName: account.displayName,
      status: account.isActive ? "활성" : "비활성",
      creator: account.createdBy.name ?? account.createdBy.email,
      createdAt: formatDate(account.createdAt),
    })),
  });
}

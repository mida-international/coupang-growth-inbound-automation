import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";

export async function resolveActiveSellerAccount(sellerId: string) {
  const accounts = await listSellerAccounts();

  return accounts.find(
    (account) => account.id === sellerId && account.isActive,
  );
}

export function encodeContentDispositionFilename(filename: string): string {
  const encoded = encodeURIComponent(filename);

  return `attachment; filename*=UTF-8''${encoded}`;
}

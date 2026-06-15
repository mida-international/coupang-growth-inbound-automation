import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

export function getDefaultSellerAccountId(
  accounts: SellerAccountView[],
): string {
  const active = accounts
    .filter((account) => account.isActive)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return active[0]?.id ?? "";
}

export function resolveSellerAccountId(
  accounts: SellerAccountView[],
  sellerParam?: string,
): string {
  const trimmed = sellerParam?.trim();

  if (
    trimmed &&
    accounts.some((account) => account.id === trimmed && account.isActive)
  ) {
    return trimmed;
  }

  return getDefaultSellerAccountId(accounts);
}

import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

export function getDefaultSellerAccountId(
  accounts: SellerAccountView[],
): string {
  const active = accounts
    .filter((account) => account.isActive)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return active[0]?.id ?? "";
}

export function parseSellerSearchParam(
  seller?: string | string[],
): string[] {
  if (!seller) {
    return [];
  }

  if (Array.isArray(seller)) {
    return seller.map((value) => value.trim()).filter(Boolean);
  }

  const trimmed = seller.trim();
  return trimmed ? [trimmed] : [];
}

export function resolveSellerAccountIds(
  accounts: SellerAccountView[],
  sellerParam?: string | string[],
): string[] {
  const activeIds = new Set(
    accounts.filter((account) => account.isActive).map((account) => account.id),
  );
  const parsed = parseSellerSearchParam(sellerParam);

  if (parsed.length === 0) {
    const defaultId = getDefaultSellerAccountId(accounts);
    return defaultId ? [defaultId] : [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of parsed) {
    if (activeIds.has(id) && !seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }

  return result;
}

export function resolveSellerAccountId(
  accounts: SellerAccountView[],
  sellerParam?: string | string[],
): string {
  return resolveSellerAccountIds(accounts, sellerParam)[0] ?? "";
}

import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import { sortSellerAccounts } from "@/services/coupang-seller-accounts/sort-seller-accounts";

export function getDefaultSellerAccountId(
  accounts: SellerAccountView[],
): string {
  const active = sortSellerAccounts(
    accounts.filter((account) => account.isActive),
  );

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

export function resolveExplicitSellerAccountId(
  accounts: SellerAccountView[],
  sellerParam?: string | string[],
): string {
  const activeIds = new Set(
    accounts.filter((account) => account.isActive).map((account) => account.id),
  );

  for (const id of parseSellerSearchParam(sellerParam)) {
    if (activeIds.has(id)) {
      return id;
    }
  }

  return "";
}

import { getDefaultSellerAccountId } from "@/services/coupang-seller-accounts/get-default-seller-account-id";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

export const INVENTORY_HEALTH_ALL_SELLERS = "all";

export type InventoryHealthSellerFilter =
  | typeof INVENTORY_HEALTH_ALL_SELLERS
  | string;

export function resolveInventoryHealthSellerFilter(
  accounts: SellerAccountView[],
  sellerParam?: string,
): InventoryHealthSellerFilter {
  const trimmed = sellerParam?.trim();

  if (trimmed === INVENTORY_HEALTH_ALL_SELLERS) {
    return INVENTORY_HEALTH_ALL_SELLERS;
  }

  if (
    trimmed &&
    accounts.some((account) => account.id === trimmed && account.isActive)
  ) {
    return trimmed;
  }

  return getDefaultSellerAccountId(accounts);
}

export function isInventoryHealthAllSellers(
  sellerFilter: InventoryHealthSellerFilter,
): sellerFilter is typeof INVENTORY_HEALTH_ALL_SELLERS {
  return sellerFilter === INVENTORY_HEALTH_ALL_SELLERS;
}

import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

const PRIMARY_SELLER_DISPLAY_NAMES = new Set(["mizucos", "mizcos"]);

export function isPrimarySellerDisplayName(displayName: string): boolean {
  return PRIMARY_SELLER_DISPLAY_NAMES.has(displayName.trim().toLowerCase());
}

export function sortSellerAccounts<T extends Pick<SellerAccountView, "displayName" | "isActive" | "createdAt">>(
  accounts: T[],
): T[] {
  return [...accounts].sort((left, right) => {
    const leftPrimary =
      left.isActive && isPrimarySellerDisplayName(left.displayName);
    const rightPrimary =
      right.isActive && isPrimarySellerDisplayName(right.displayName);

    if (leftPrimary !== rightPrimary) {
      return leftPrimary ? -1 : 1;
    }

    const nameCompare = left.displayName.localeCompare(
      right.displayName,
      "ko",
    );

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return left.createdAt.getTime() - right.createdAt.getTime();
  });
}

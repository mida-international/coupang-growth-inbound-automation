import { prisma } from "@/lib/db";
import { sortSellerAccounts } from "@/services/coupang-seller-accounts/sort-seller-accounts";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

export async function listSellerAccounts(): Promise<SellerAccountView[]> {
  const accounts = await prisma.coupangSellerAccount.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return sortSellerAccounts(accounts);
}

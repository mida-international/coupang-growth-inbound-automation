import { prisma } from "@/lib/db";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";

export async function listSellerAccounts(): Promise<SellerAccountView[]> {
  return prisma.coupangSellerAccount.findMany({
    orderBy: { createdAt: "desc" },
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
}

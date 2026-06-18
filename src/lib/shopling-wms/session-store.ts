import type { BrowserContext } from "playwright";

import { prisma } from "@/lib/db";

export type ShoplingWmsStorageState = Awaited<
  ReturnType<BrowserContext["storageState"]>
>;

const SESSION_TTL_MS = 30 * 60 * 1000;

export async function saveShoplingWmsSession(
  userId: string,
  storageState: ShoplingWmsStorageState,
  expiresAt: Date = new Date(Date.now() + SESSION_TTL_MS),
): Promise<void> {
  await prisma.shoplingWmsSession.upsert({
    where: { userId },
    create: {
      userId,
      storageState: storageState as object,
      expiresAt,
    },
    update: {
      storageState: storageState as object,
      expiresAt,
    },
  });
}

export async function getShoplingWmsSession(
  userId: string,
): Promise<ShoplingWmsStorageState | null> {
  const row = await prisma.shoplingWmsSession.findUnique({
    where: { userId },
  });

  if (!row) {
    return null;
  }

  if (row.expiresAt.getTime() <= Date.now()) {
    await prisma.shoplingWmsSession
      .delete({ where: { userId } })
      .catch(() => undefined);

    return null;
  }

  return row.storageState as ShoplingWmsStorageState;
}

export async function clearShoplingWmsSession(userId: string): Promise<void> {
  await prisma.shoplingWmsSession
    .delete({ where: { userId } })
    .catch(() => undefined);
}

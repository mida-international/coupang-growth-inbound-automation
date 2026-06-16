import type { BrowserContext } from "playwright";

type ShoplingWmsStorageState = Awaited<
  ReturnType<BrowserContext["storageState"]>
>;

const SESSION_TTL_MS = 30 * 60 * 1000;

type SessionEntry = {
  storageState: ShoplingWmsStorageState;
  createdAt: number;
};

const sessions = new Map<string, SessionEntry>();

export function saveShoplingWmsSession(
  userId: string,
  storageState: ShoplingWmsStorageState,
): void {
  sessions.set(userId, {
    storageState,
    createdAt: Date.now(),
  });
}

export function getShoplingWmsSession(
  userId: string,
): ShoplingWmsStorageState | null {
  const entry = sessions.get(userId);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.createdAt > SESSION_TTL_MS) {
    sessions.delete(userId);
    return null;
  }

  return entry.storageState;
}

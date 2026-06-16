import { randomUUID } from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";

import type { Browser, BrowserContext, Page } from "playwright";
import { chromium } from "playwright";

import { getShoplingWmsSession } from "@/lib/shopling-wms/session-store";

import { attachDialogAutoAccept } from "./dialogs";

export type ShoplingWmsBrowserSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  workDir: string;
};

export async function launchShoplingWmsBrowser(
  userId: string,
): Promise<ShoplingWmsBrowserSession | null> {
  const storageState = getShoplingWmsSession(userId);

  if (!storageState) {
    return null;
  }

  const workDir = path.join(os.tmpdir(), "shopling-wms", randomUUID());
  await fs.mkdir(workDir, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState,
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
  });

  attachDialogAutoAccept(context);

  const page = await context.newPage();

  return { browser, context, page, workDir };
}

export async function closeShoplingWmsBrowser(
  session: ShoplingWmsBrowserSession,
): Promise<void> {
  await session.browser.close();
}

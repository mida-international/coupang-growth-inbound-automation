import { randomUUID } from "crypto";

import type { Browser, BrowserContext, Page } from "playwright";

import { attachDialogAutoAccept } from "@/lib/shopling-wms/browser/dialogs";
import { launchShoplingBrowser } from "@/lib/shopling-wms/browser/launch";
import { createShoplingWmsRunDirs } from "@/lib/shopling-wms/paths";
import { getShoplingWmsSession } from "@/lib/shopling-wms/session-store";

export type ShoplingWmsBrowserSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  runId: string;
  runDir: string;
  downloadDir: string;
  outputDir: string;
};

export async function launchShoplingWmsBrowser(
  userId: string,
): Promise<ShoplingWmsBrowserSession | null> {
  const storageState = await getShoplingWmsSession(userId);

  if (!storageState) {
    return null;
  }

  const runId = randomUUID();
  const { runDir, downloadDir, outputDir } =
    await createShoplingWmsRunDirs(runId);

  const browser = await launchShoplingBrowser();
  const context = await browser.newContext({
    storageState,
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
  });

  attachDialogAutoAccept(context);

  const page = await context.newPage();

  return { browser, context, page, runId, runDir, downloadDir, outputDir };
}

export async function closeShoplingWmsBrowser(
  session: ShoplingWmsBrowserSession,
): Promise<void> {
  await session.browser.close();
}

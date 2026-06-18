import fs from "fs/promises";
import path from "path";
import type { Page } from "playwright";

import {
  dismissMainOrderDelay,
  gotoShoplingPath,
} from "@/lib/shopling-wms/browser/frames";
import { getShoplingWmsFrameWaitMs } from "@/lib/shopling-wms/constants";
import {
  clickInventoryExcelDownload,
  clickInventorySearch,
  configureNegativeStockSearch,
  findInventorySearchFrame,
} from "@/lib/shopling-wms/negative-stock/inventory-search-form";
import {
  getShoplingWmsDownloadDir,
  getShoplingWmsRunDir,
} from "@/lib/shopling-wms/paths";

const INVENTORY_LIST_PATH = "/invntryn/goods_inventory_list.phtml";

async function capturePhase1Failure(page: Page, runId: string): Promise<void> {
  const screenshotPath = path.join(getShoplingWmsRunDir(runId), "phase1-failure.png");

  await page
    .screenshot({ path: screenshotPath, fullPage: true })
    .catch(() => undefined);
}

export async function downloadNegativeInventoryExcel(
  page: Page,
  runId: string,
): Promise<Buffer> {
  try {
    await gotoShoplingPath(page, INVENTORY_LIST_PATH);

    const frame = await findInventorySearchFrame(page);
    await configureNegativeStockSearch(frame);
    await clickInventorySearch(frame);
    await dismissMainOrderDelay(page);

    const excelButton = await clickInventoryExcelDownload(frame);

    const downloadPromise = page.waitForEvent("download", {
      timeout: getShoplingWmsFrameWaitMs(),
    });

    await excelButton.click();

    const download = await downloadPromise;
    const downloadPath = path.join(
      getShoplingWmsDownloadDir(runId),
      "shopling_inventory.xlsx",
    );
    await download.saveAs(downloadPath);

    return fs.readFile(downloadPath);
  } catch (error) {
    await capturePhase1Failure(page, runId);

    if (error instanceof Error) {
      throw new Error(`${error.message} (현재 URL: ${page.url()})`);
    }

    throw error;
  }
}

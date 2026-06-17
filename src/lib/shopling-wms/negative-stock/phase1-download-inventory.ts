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
import { getShoplingWmsDownloadDir } from "@/lib/shopling-wms/paths";

const INVENTORY_LIST_PATH = "/invntryn/goods_inventory_list.phtml";

export async function downloadNegativeInventoryExcel(
  page: Page,
  runId: string,
): Promise<Buffer> {
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
}

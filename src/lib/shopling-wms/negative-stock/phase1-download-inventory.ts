import fs from "fs/promises";
import path from "path";
import type { Page } from "playwright";

import {
  dismissMainOrderDelay,
  findFrameBySelector,
  gotoShoplingPath,
  stepDelay,
} from "@/lib/shopling-wms/browser/frames";
import { getShoplingWmsFrameWaitMs } from "@/lib/shopling-wms/constants";
import { getShoplingWmsDownloadDir } from "@/lib/shopling-wms/paths";

const INVENTORY_LIST_PATH = "/invntryn/goods_inventory_list.phtml";

export async function downloadNegativeInventoryExcel(
  page: Page,
  runId: string,
): Promise<Buffer> {
  await gotoShoplingPath(page, INVENTORY_LIST_PATH);

  const frame = await findFrameBySelector(
    page,
    'select[name="srch_opt_cnt"]',
    getShoplingWmsFrameWaitMs(),
  );

  await frame.locator('select[name="srch_opt_cnt"]').selectOption("A");
  await stepDelay();
  await frame.locator("#srch_opt_s_cnt").fill("-999");
  await stepDelay();
  await frame.locator("#srch_opt_e_cnt").fill("-1");
  await stepDelay();

  await frame.locator('input[type="button"][value="검색"]').click();
  await stepDelay();
  await dismissMainOrderDelay(page);

  const excelButton = frame.locator('input[onclick="stock_excel_save();"]');
  await excelButton.waitFor({
    state: "visible",
    timeout: getShoplingWmsFrameWaitMs(),
  });

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

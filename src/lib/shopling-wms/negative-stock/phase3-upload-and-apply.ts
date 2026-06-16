import type { Page } from "playwright";

import {
  getShoplingWmsFrameWaitMs,
  getShoplingWmsPostSavePauseMs,
} from "@/lib/shopling-wms/constants";
import {
  delay,
  dismissMainOrderDelay,
  findFrameBySelector,
  gotoShoplingPath,
  stepDelay,
} from "@/lib/shopling-wms/browser/frames";

const IMPORT_LIST_PATH = "/invntryn/goodsImportLst.phtml";

async function selectOptionByLabel(
  page: Page,
  selector: string,
  label: string,
): Promise<void> {
  const select = page.locator(selector);
  const options = select.locator("option");
  const count = await options.count();

  for (let index = 0; index < count; index += 1) {
    const option = options.nth(index);
    const text = (await option.textContent())?.trim() ?? "";

    if (text.includes(label)) {
      const value = await option.getAttribute("value");

      if (value) {
        await select.selectOption(value);
        return;
      }
    }
  }

  throw new Error(`옵션을 찾을 수 없습니다: ${selector} (${label})`);
}

async function closePopupIfNeeded(popup: Page): Promise<void> {
  const closeCandidates = [
    popup.locator('input[value="닫기"]'),
    popup.locator('input[onclick*="close"]'),
    popup.getByRole("button", { name: "닫기" }),
  ];

  for (const candidate of closeCandidates) {
    if ((await candidate.count()) > 0) {
      await candidate.first().click().catch(() => undefined);
      await stepDelay();
      break;
    }
  }

  if (!popup.isClosed()) {
    await popup.close().catch(() => undefined);
  }
}

export async function uploadStockImportAndApply(
  page: Page,
  filledFilePath: string,
  memo: string,
): Promise<void> {
  await gotoShoplingPath(page, IMPORT_LIST_PATH);

  const contentFrame = await findFrameBySelector(
    page,
    'input[onclick="excel_reg();"]',
  );

  const popupPromise = page.waitForEvent("popup", {
    timeout: getShoplingWmsFrameWaitMs(),
  });

  await contentFrame.locator('input[onclick="excel_reg();"]').click();

  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  await stepDelay();

  await selectOptionByLabel(popup, "#strage_cd", "분류");
  await stepDelay();
  await selectOptionByLabel(popup, "#detail_tp", "정상");
  await stepDelay();
  await popup.locator('input[name="memo"]').fill(memo);
  await stepDelay();
  await popup
    .locator('input[type="file"][name="stkExlFile"]')
    .setInputFiles(filledFilePath);
  await stepDelay();

  await popup.locator('input[onclick="check_submit();"]').click();
  await delay(getShoplingWmsPostSavePauseMs());
  await closePopupIfNeeded(popup);

  await gotoShoplingPath(page, IMPORT_LIST_PATH);

  const listFrame = await findFrameBySelector(
    page,
    'input[type="button"][value="검색"]',
  );

  await listFrame.locator('input[type="button"][value="검색"]').click();
  await stepDelay();
  await dismissMainOrderDelay(page);

  const targetRow = listFrame.locator("tr", { hasText: memo }).first();
  await targetRow.waitFor({
    state: "visible",
    timeout: getShoplingWmsFrameWaitMs(),
  });

  await targetRow.locator('input[type="checkbox"]').check();
  await stepDelay();

  await listFrame.locator('input[type="button"][value="재고반영"]').click();
  await stepDelay();

  const confirmButton = page
    .getByRole("button", { name: "확인" })
    .or(page.locator('input[type="button"][value="확인"]'))
    .first();

  if ((await confirmButton.count()) > 0) {
    await confirmButton.click();
    await stepDelay();
  }
}

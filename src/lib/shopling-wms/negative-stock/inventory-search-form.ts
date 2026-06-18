import type { Frame, Page } from "playwright";

import {
  assertShoplingWmsAuthenticated,
  delay,
  detectShoplingLoginFrame,
  findFrameByAnySelector,
  findVisibleFrameByAnySelector,
  stepDelay,
} from "@/lib/shopling-wms/browser/frames";
import {
  SHOPLING_LOGIN_REQUIRED_MESSAGE,
  SHOPLING_SESSION_EXPIRED_MESSAGE,
  isShoplingWmsLoginUrl,
} from "@/lib/shopling-wms/browser/shopling-auth";
import {
  firstVisibleLocator,
  firstVisibleRoleLocator,
  selectFirstMatchingOption,
  selectOptionByLabel,
} from "@/lib/shopling-wms/browser/select-option";
import { getShoplingWmsFrameWaitMs } from "@/lib/shopling-wms/constants";

/** 재고 목록 검색 폼이 있는 프레임을 찾을 때 시도하는 앵커 (신·구 UI 호환) */
export const INVENTORY_SEARCH_FRAME_SELECTORS = [
  "#srch_opt_s_cnt",
  'input[name="srch_opt_s_cnt"]',
  "#srch_opt_e_cnt",
  'select[name="srch_opt_cnt"]',
  "#srch_opt_cnt",
  'select[name="srch_opt_stock"]',
  'input[onclick="stock_excel_save();"]',
  'input[type="button"][value="검색"]',
  'input[value="EXCEL 저장"]',
  'input[value*="엑셀"]',
] as const;

const STOCK_COUNT_TYPE_SELECTORS = [
  'select[name="srch_opt_cnt"]',
  "#srch_opt_cnt",
  'select[name="srch_opt_stock"]',
  'select[name="srch_opt_real_cnt"]',
  'select[name="srch_opt_vrtl_cnt"]',
] as const;

const STOCK_RANGE_START_SELECTORS = [
  "#srch_opt_s_cnt",
  'input[name="srch_opt_s_cnt"]',
  "#srch_opt_s_stock",
  'input[name="srch_opt_s_stock"]',
] as const;

const STOCK_RANGE_END_SELECTORS = [
  "#srch_opt_e_cnt",
  'input[name="srch_opt_e_cnt"]',
  "#srch_opt_e_stock",
  'input[name="srch_opt_e_stock"]',
] as const;

const SEARCH_BUTTON_SELECTORS = [
  'input[type="button"][value="검색"]',
  'input[type="submit"][value="검색"]',
  'button:has-text("검색")',
] as const;

const EXCEL_BUTTON_SELECTORS = [
  'input[onclick="stock_excel_save();"]',
  'input[onclick*="stock_excel_save"]',
  'input[value="EXCEL 저장"]',
  'input[value="엑셀저장"]',
  'input[value="엑셀 저장"]',
  'input[value*="엑셀"]',
] as const;

async function findInventorySearchFrameByRole(page: Page): Promise<Frame | null> {
  for (const frame of page.frames()) {
    const searchButton = await firstVisibleRoleLocator(frame, "button", "검색");

    if (searchButton) {
      return frame;
    }

    const excelButton = await firstVisibleRoleLocator(frame, "button", /엑셀/i);

    if (excelButton) {
      return frame;
    }
  }

  return null;
}

function throwShoplingAuthError(page: Page): never {
  if (isShoplingWmsLoginUrl(page.url())) {
    throw new Error(SHOPLING_LOGIN_REQUIRED_MESSAGE);
  }

  throw new Error(SHOPLING_SESSION_EXPIRED_MESSAGE);
}

async function findInventorySearchFrameWithFallback(
  page: Page,
): Promise<Frame> {
  const timeoutMs = getShoplingWmsFrameWaitMs();
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const cssFrame = await findVisibleFrameByAnySelector(
      page,
      INVENTORY_SEARCH_FRAME_SELECTORS,
    );

    if (cssFrame) {
      return cssFrame;
    }

    const roleFrame = await findInventorySearchFrameByRole(page);

    if (roleFrame) {
      return roleFrame;
    }

    const loginFrame = await detectShoplingLoginFrame(page);

    if (loginFrame) {
      throwShoplingAuthError(page);
    }

    await delay(250);
  }

  const roleFrame = await findInventorySearchFrameByRole(page);

  if (roleFrame) {
    return roleFrame;
  }

  const loginFrame = await detectShoplingLoginFrame(page);

  if (loginFrame) {
    throwShoplingAuthError(page);
  }

  return findFrameByAnySelector(
    page,
    [...INVENTORY_SEARCH_FRAME_SELECTORS],
    1,
  );
}

async function findStockRangeInput(
  frame: Frame,
  selectors: readonly string[],
  labelHints: string[],
): Promise<ReturnType<Frame["locator"]> | null> {
  const bySelector = await firstVisibleLocator(frame, [...selectors]);

  if (bySelector) {
    return bySelector;
  }

  for (const hint of labelHints) {
    const row = frame.locator("tr", { hasText: hint }).first();

    if ((await row.count()) === 0) {
      continue;
    }

    const input = row.locator('input[type="text"]').first();

    if (
      (await input.count()) > 0 &&
      (await input.isVisible().catch(() => false))
    ) {
      return input;
    }
  }

  return null;
}

export async function findInventorySearchFrame(
  page: Page,
): Promise<Frame> {
  await assertShoplingWmsAuthenticated(page);

  return findInventorySearchFrameWithFallback(page);
}

async function configureStockCountType(frame: Frame): Promise<void> {
  for (const selector of STOCK_COUNT_TYPE_SELECTORS) {
    if ((await frame.locator(selector).count()) === 0) {
      continue;
    }

    if (await selectFirstMatchingOption(frame, selector, ["A", "a"])) {
      return;
    }

    if (await selectOptionByLabel(frame, selector, "가용")) {
      return;
    }

    if (await selectOptionByLabel(frame, selector, "가용재고")) {
      return;
    }
  }
}

export async function configureNegativeStockSearch(
  frame: Frame,
): Promise<void> {
  await configureStockCountType(frame);
  await stepDelay();

  const startInput = await findStockRangeInput(frame, STOCK_RANGE_START_SELECTORS, [
    "가용",
    "재고",
    "시작",
  ]);

  if (!startInput) {
    throw new Error(
      "음수 재고 검색 시작 입력란을 찾을 수 없습니다. (#srch_opt_s_cnt)",
    );
  }

  await startInput.fill("-999");
  await stepDelay();

  const endInput = await findStockRangeInput(frame, STOCK_RANGE_END_SELECTORS, [
    "가용",
    "재고",
    "종료",
  ]);

  if (!endInput) {
    throw new Error(
      "음수 재고 검색 종료 입력란을 찾을 수 없습니다. (#srch_opt_e_cnt)",
    );
  }

  await endInput.fill("-1");
  await stepDelay();
}

export async function clickInventorySearch(frame: Frame): Promise<void> {
  const searchButton =
    (await firstVisibleLocator(frame, [...SEARCH_BUTTON_SELECTORS])) ??
    (await firstVisibleRoleLocator(frame, "button", "검색"));

  if (!searchButton) {
    throw new Error('재고 목록 "검색" 버튼을 찾을 수 없습니다.');
  }

  await searchButton.click();
  await stepDelay();
}

export async function clickInventoryExcelDownload(
  frame: Frame,
): Promise<ReturnType<Frame["locator"]>> {
  const excelButton =
    (await firstVisibleLocator(frame, [...EXCEL_BUTTON_SELECTORS])) ??
    (await firstVisibleRoleLocator(frame, "button", /엑셀/i));

  if (!excelButton) {
    throw new Error("재고 엑셀 저장 버튼을 찾을 수 없습니다.");
  }

  await excelButton.waitFor({
    state: "visible",
    timeout: getShoplingWmsFrameWaitMs(),
  });

  return excelButton;
}

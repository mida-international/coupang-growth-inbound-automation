import type { Frame, Page } from "playwright";

import {
  getShoplingWmsFrameWaitMs,
  getShoplingWmsStepDelayMs,
  SHOPLING_WMS_BASE_URL,
} from "@/lib/shopling-wms/constants";
import {
  isShoplingWmsLoginUrl,
  SHOPLING_LOGIN_ANCHOR_SELECTORS,
  SHOPLING_LOGIN_REQUIRED_MESSAGE,
  SHOPLING_SESSION_EXPIRED_MESSAGE,
} from "@/lib/shopling-wms/browser/shopling-auth";

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function stepDelay(): Promise<void> {
  await delay(getShoplingWmsStepDelayMs());
}

export async function dismissMainOrderDelay(page: Page): Promise<void> {
  for (const frame of page.frames()) {
    await frame
      .locator(".main_order_delay")
      .evaluateAll((elements) => {
        for (const element of elements) {
          (element as HTMLElement).style.display = "none";
        }
      })
      .catch(() => undefined);
  }
}

async function isVisibleInFrame(
  frame: Frame,
  selector: string,
): Promise<boolean> {
  const locator = frame.locator(selector).first();

  if ((await locator.count()) === 0) {
    return false;
  }

  return locator.isVisible().catch(() => false);
}

async function findVisibleFrameBySelector(
  page: Page,
  selector: string,
): Promise<Frame | null> {
  for (const frame of page.frames()) {
    if (await isVisibleInFrame(frame, selector)) {
      return frame;
    }
  }

  return null;
}

export async function findVisibleFrameByAnySelector(
  page: Page,
  selectors: readonly string[],
): Promise<Frame | null> {
  for (const frame of page.frames()) {
    for (const selector of selectors) {
      if (await isVisibleInFrame(frame, selector)) {
        return frame;
      }
    }
  }

  return null;
}

export async function detectShoplingLoginFrame(
  page: Page,
): Promise<Frame | null> {
  for (const frame of page.frames()) {
    for (const selector of SHOPLING_LOGIN_ANCHOR_SELECTORS) {
      if (await isVisibleInFrame(frame, selector)) {
        return frame;
      }
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

export async function assertShoplingWmsAuthenticated(page: Page): Promise<void> {
  if (isShoplingWmsLoginUrl(page.url())) {
    throw new Error(SHOPLING_LOGIN_REQUIRED_MESSAGE);
  }

  const loginFrame = await detectShoplingLoginFrame(page);

  if (loginFrame) {
    throw new Error(SHOPLING_SESSION_EXPIRED_MESSAGE);
  }
}

export async function waitForShoplingIframe(page: Page): Promise<void> {
  const timeoutMs = getShoplingWmsFrameWaitMs();

  await page
    .waitForFunction(
      () => document.querySelectorAll("iframe").length > 0,
      { timeout: timeoutMs },
    )
    .catch(() => undefined);

  await page
    .waitForFunction(
      () => window.frames.length > 1,
      { timeout: timeoutMs },
    )
    .catch(() => undefined);
}

export async function findFrameBySelector(
  page: Page,
  selector: string,
  timeoutMs = getShoplingWmsFrameWaitMs(),
): Promise<Frame> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const frame = await findVisibleFrameBySelector(page, selector);

    if (frame) {
      return frame;
    }

    const loginFrame = await detectShoplingLoginFrame(page);

    if (loginFrame) {
      throwShoplingAuthError(page);
    }

    await delay(250);
  }

  const loginFrame = await detectShoplingLoginFrame(page);

  if (loginFrame) {
    throwShoplingAuthError(page);
  }

  throw new Error(
    `재고 화면 요소를 찾을 수 없습니다 (${selector}). 현재 URL: ${page.url()}`,
  );
}

export async function findFrameByAnySelector(
  page: Page,
  selectors: readonly string[],
  timeoutMs = getShoplingWmsFrameWaitMs(),
): Promise<Frame> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const frame = await findVisibleFrameByAnySelector(page, selectors);

    if (frame) {
      return frame;
    }

    const loginFrame = await detectShoplingLoginFrame(page);

    if (loginFrame) {
      throwShoplingAuthError(page);
    }

    await delay(250);
  }

  const loginFrame = await detectShoplingLoginFrame(page);

  if (loginFrame) {
    throwShoplingAuthError(page);
  }

  throw new Error(
    `재고 목록 검색 화면을 찾을 수 없습니다. 현재 URL: ${page.url()}`,
  );
}

export async function gotoShoplingPath(
  page: Page,
  shoplingPath: string,
): Promise<void> {
  const url = shoplingPath.startsWith("http")
    ? shoplingPath
    : `${SHOPLING_WMS_BASE_URL}${shoplingPath}`;

  const timeoutMs = getShoplingWmsFrameWaitMs();

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: timeoutMs,
  });

  await page
    .waitForLoadState("networkidle", { timeout: timeoutMs })
    .catch(() => undefined);

  await waitForShoplingIframe(page);
  await stepDelay();
  await dismissMainOrderDelay(page);
}

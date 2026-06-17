import type { Frame, Page } from "playwright";

import {
  getShoplingWmsFrameWaitMs,
  getShoplingWmsStepDelayMs,
  SHOPLING_WMS_BASE_URL,
} from "@/lib/shopling-wms/constants";

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

export async function findFrameBySelector(
  page: Page,
  selector: string,
  timeoutMs = getShoplingWmsFrameWaitMs(),
): Promise<Frame> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const count = await frame.locator(selector).count();

      if (count > 0) {
        return frame;
      }
    }

    await delay(250);
  }

  throw new Error(`셀렉터를 찾을 수 없습니다: ${selector}`);
}

export async function findFrameByAnySelector(
  page: Page,
  selectors: readonly string[],
  timeoutMs = getShoplingWmsFrameWaitMs(),
): Promise<Frame> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      for (const selector of selectors) {
        const count = await frame.locator(selector).count();

        if (count > 0) {
          return frame;
        }
      }
    }

    await delay(250);
  }

  throw new Error(`셀렉터를 찾을 수 없습니다: ${selectors.join(", ")}`);
}

function isShoplingWmsLoginPage(url: string | URL): boolean {
  const href = typeof url === "string" ? url : url.href;
  return href.includes("login.phtml");
}

export async function assertShoplingWmsAuthenticated(page: Page): Promise<void> {
  if (isShoplingWmsLoginPage(page.url())) {
    throw new Error(
      "샵플링 WMS 로그인이 필요합니다. 자동화 실행 전 로그인을 완료해 주세요.",
    );
  }
}

export async function gotoShoplingPath(
  page: Page,
  shoplingPath: string,
): Promise<void> {
  const url = shoplingPath.startsWith("http")
    ? shoplingPath
    : `${SHOPLING_WMS_BASE_URL}${shoplingPath}`;

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: getShoplingWmsFrameWaitMs(),
  });

  await stepDelay();
  await dismissMainOrderDelay(page);
}

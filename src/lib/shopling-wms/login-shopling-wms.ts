import { chromium } from "playwright";

import {
  getShoplingWmsLoginId,
  getShoplingWmsLoginPassword,
  getShoplingWmsLoginTimeoutMs,
  getShoplingWmsLoginUrl,
} from "@/lib/shopling-wms/constants";
import { saveShoplingWmsSession } from "@/lib/shopling-wms/session-store";

export type ShoplingWmsLoginResult =
  | { ok: true }
  | { ok: false; message: string };

function isLoginPageUrl(url: string | URL): boolean {
  const href = typeof url === "string" ? url : url.href;
  return href.includes("login.phtml");
}

function isMissingChromiumExecutableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("executable doesn't exist") ||
    message.includes("playwright install")
  );
}

function isLocatorError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("strict mode violation") ||
    message.includes("locator")
  );
}

export async function loginShoplingWms(
  userId: string,
): Promise<ShoplingWmsLoginResult> {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    const loginUrl = getShoplingWmsLoginUrl();
    const loginId = getShoplingWmsLoginId();
    const loginPassword = getShoplingWmsLoginPassword();
    const timeoutMs = getShoplingWmsLoginTimeoutMs();

    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    await page.goto(loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const idInput = page.locator("#login_id");
    const passwordInput = page.locator("#login_pw").or(
      page.locator('input[name="login_pw"]'),
    );

    await idInput.waitFor({ state: "visible", timeout: 30_000 });
    await passwordInput.waitFor({ state: "visible", timeout: 30_000 });

    await idInput.fill(loginId);
    await passwordInput.fill(loginPassword);

    await page.waitForURL((url) => !isLoginPageUrl(url), {
      timeout: timeoutMs,
    });

    if (isLoginPageUrl(page.url())) {
      return {
        ok: false,
        message: "로그인에 실패했습니다. 캡차 입력 후 다시 시도해 주세요.",
      };
    }

    const storageState = await context.storageState();
    saveShoplingWmsSession(userId, storageState);

    await browser.close();
    browser = undefined;

    return { ok: true };
  } catch (error) {
    if (isMissingChromiumExecutableError(error)) {
      return {
        ok: false,
        message:
          "Playwright Chromium이 설치되지 않았습니다. 터미널에서 `npm run playwright:install`을 실행한 뒤 다시 시도해 주세요.",
      };
    }

    if (isLocatorError(error)) {
      return {
        ok: false,
        message:
          "로그인 페이지 요소를 찾지 못했습니다. 브라우저에서 직접 로그인을 시도해 주세요.",
      };
    }

    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.message.includes("Timeout"))
    ) {
      return {
        ok: false,
        message:
          "로그인 시간이 초과되었습니다. 캡차 입력 후 로그인을 완료해 주세요.",
      };
    }

    const message =
      error instanceof Error ? error.message : "로그인에 실패했습니다.";

    return { ok: false, message };
  }
}

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

    const idInput = page.getByLabel("아이디");
    const passwordInput = page.getByLabel("비밀번호", { exact: false });

    await idInput.waitFor({ state: "visible", timeout: 30_000 });
    await passwordInput.waitFor({ state: "visible", timeout: 30_000 });

    await idInput.fill(loginId);
    await passwordInput.fill(loginPassword);

    const loginButton = page
      .getByRole("button", { name: /로그인/i })
      .or(page.locator('input[type="submit"]'))
      .first();

    await loginButton.click();

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

    return { ok: true };
  } catch (error) {
    if (isMissingChromiumExecutableError(error)) {
      return {
        ok: false,
        message:
          "Playwright Chromium이 설치되지 않았습니다. 터미널에서 `npm run playwright:install`을 실행한 뒤 다시 시도해 주세요.",
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
  } finally {
    await browser?.close();
  }
}

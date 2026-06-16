import type { Browser } from "playwright-core";

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

export async function launchShoplingBrowser(): Promise<Browser> {
  if (isVercelRuntime()) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const { chromium: playwrightChromium } = await import("playwright-core");

    return playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const { chromium } = await import("playwright");

  return chromium.launch({ headless: false });
}

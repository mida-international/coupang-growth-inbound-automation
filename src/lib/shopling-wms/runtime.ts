export function isShoplingWmsAutomationAvailable(): boolean {
  if (process.env.SHOPLING_WMS_AUTOMATION_DISABLED === "true") {
    return false;
  }

  if (process.env.VERCEL === "1") {
    return false;
  }

  return true;
}

export const SHOPLING_WMS_AUTOMATION_UNAVAILABLE_MESSAGE =
  "샵플링 WMS 자동화는 로컬 환경에서만 실행할 수 있습니다.";

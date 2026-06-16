export function isShoplingWmsAutomationDisabled(): boolean {
  return process.env.SHOPLING_WMS_AUTOMATION_DISABLED === "true";
}

export function isShoplingWmsLoginAvailable(): boolean {
  if (isShoplingWmsAutomationDisabled()) {
    return false;
  }

  return process.env.VERCEL !== "1";
}

export function isShoplingWmsRunAvailable(): boolean {
  return !isShoplingWmsAutomationDisabled();
}

/** @deprecated Use isShoplingWmsRunAvailable instead */
export function isShoplingWmsAutomationAvailable(): boolean {
  return isShoplingWmsRunAvailable();
}

export const SHOPLING_WMS_LOGIN_UNAVAILABLE_MESSAGE =
  "캡차 로그인은 로컬 환경에서만 가능합니다. 로컬에서 로그인하면 세션이 DB에 저장되어 배포 환경에서 음수빼기를 실행할 수 있습니다.";

export const SHOPLING_WMS_AUTOMATION_UNAVAILABLE_MESSAGE =
  "샵플링 WMS 자동화가 비활성화되어 있습니다.";

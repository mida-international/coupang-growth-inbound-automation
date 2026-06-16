const DEFAULT_SHOPLING_WMS_LOGIN_URL = "https://a.shopling.co.kr/login.phtml";
const DEFAULT_SHOPLING_WMS_LOGIN_TIMEOUT_MS = 180_000;
const DEFAULT_SHOPLING_WMS_STEP_DELAY_MS = 1_200;
const DEFAULT_SHOPLING_WMS_FRAME_WAIT_MS = 60_000;
const DEFAULT_SHOPLING_WMS_POST_SAVE_PAUSE_MS = 3_000;

export const SHOPLING_WMS_BASE_URL = "https://a.shopling.co.kr";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} 환경 변수가 설정되지 않았습니다.`);
  }

  return value;
}

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
): number {
  if (!raw?.trim()) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getShoplingWmsLoginUrl(): string {
  return (
    process.env.SHOPLING_WMS_LOGIN_URL?.trim() || DEFAULT_SHOPLING_WMS_LOGIN_URL
  );
}

export function getShoplingWmsLoginId(): string {
  return requireEnv("SHOPLING_WMS_LOGIN_ID");
}

export function getShoplingWmsLoginPassword(): string {
  return requireEnv("SHOPLING_WMS_LOGIN_PASSWORD");
}

export function getShoplingWmsLoginTimeoutMs(): number {
  return parsePositiveInt(
    process.env.SHOPLING_WMS_LOGIN_TIMEOUT_MS,
    DEFAULT_SHOPLING_WMS_LOGIN_TIMEOUT_MS,
  );
}

export function getShoplingWmsStepDelayMs(): number {
  return parsePositiveInt(
    process.env.SHOPLING_WMS_STEP_DELAY_MS,
    DEFAULT_SHOPLING_WMS_STEP_DELAY_MS,
  );
}

export function getShoplingWmsFrameWaitMs(): number {
  return parsePositiveInt(
    process.env.SHOPLING_WMS_FRAME_WAIT_MS,
    DEFAULT_SHOPLING_WMS_FRAME_WAIT_MS,
  );
}

export function getShoplingWmsPostSavePauseMs(): number {
  return parsePositiveInt(
    process.env.SHOPLING_WMS_POST_SAVE_PAUSE_MS,
    DEFAULT_SHOPLING_WMS_POST_SAVE_PAUSE_MS,
  );
}

const DEFAULT_SHOPLING_WMS_LOGIN_URL = "https://a.shopling.co.kr/login.phtml";
const DEFAULT_SHOPLING_WMS_LOGIN_TIMEOUT_MS = 180_000;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} 환경 변수가 설정되지 않았습니다.`);
  }

  return value;
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
  const raw = process.env.SHOPLING_WMS_LOGIN_TIMEOUT_MS?.trim();

  if (!raw) {
    return DEFAULT_SHOPLING_WMS_LOGIN_TIMEOUT_MS;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SHOPLING_WMS_LOGIN_TIMEOUT_MS;
  }

  return parsed;
}

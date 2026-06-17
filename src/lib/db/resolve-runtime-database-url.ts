/**
 * Supabase session pooler(5432)는 동시 클라이언트가 15개로 제한된다.
 * Next.js + Prisma는 transaction pooler(6543) + pgbouncer=true 를 사용해야 한다.
 */

const SESSION_POOLER_HOST_PORT = /pooler\.supabase\.com:5432\b/;

function appendQueryParam(url: string, key: string, value: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${key}=${value}`;
}

function hasQueryParam(url: string, key: string): boolean {
  return new RegExp(`[?&]${key}=`).test(url);
}

export function isSupabaseSessionPoolerUrl(connectionString: string): boolean {
  return SESSION_POOLER_HOST_PORT.test(connectionString);
}

export function upgradeSupabaseSessionPoolerToTransaction(
  connectionString: string,
): string {
  let upgraded = connectionString.replace(
    SESSION_POOLER_HOST_PORT,
    "pooler.supabase.com:6543",
  );

  if (!hasQueryParam(upgraded, "pgbouncer")) {
    upgraded = appendQueryParam(upgraded, "pgbouncer", "true");
  }

  return upgraded;
}

export function resolveRuntimeDatabaseUrl(): string {
  const transactionUrl = process.env.DATABASE_URL_TRANSACTION?.trim();
  if (transactionUrl) {
    return transactionUrl;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  if (process.env.DATABASE_DISABLE_POOLER_UPGRADE === "true") {
    return databaseUrl;
  }

  if (!isSupabaseSessionPoolerUrl(databaseUrl)) {
    return databaseUrl;
  }

  return upgradeSupabaseSessionPoolerToTransaction(databaseUrl);
}

let loggedPoolerUpgrade = false;

export function logPoolerUpgradeOnce(
  originalUrl: string,
  runtimeUrl: string,
): void {
  if (loggedPoolerUpgrade || originalUrl === runtimeUrl) {
    return;
  }

  loggedPoolerUpgrade = true;

  console.warn(
    "[db] Supabase session pooler(5432)는 동시 연결 15개 제한이 있습니다. " +
      "앱 런타임 연결을 transaction pooler(6543)로 자동 전환했습니다. " +
      "DATABASE_URL_TRANSACTION을 .env에 직접 설정하거나, " +
      "DATABASE_DISABLE_POOLER_UPGRADE=true 로 자동 전환을 끌 수 있습니다.",
  );
}

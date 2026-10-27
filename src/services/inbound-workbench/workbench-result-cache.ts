import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

/**
 * 입고 작업대(대시보드 첫 화면) 결과 캐시.
 *
 * 왜: 화면을 열 때마다 선택 계정의 전체 표(수천 줄)를 처음부터 다시 계산해 4~5초가 걸렸다
 * (2026-10-09 진단 1번). 자료는 하루 한두 번(동기화·업로드·⑦ 확정)만 바뀌므로,
 * 자료가 바뀌지 않았으면 지난 결과를 그대로 돌려준다.
 *
 * 어떻게: 자료 버전을 가벼운 쿼리 한 번으로 구한다(각 원천 표의 최신 시각·건수).
 * 버전 + 조회 조건이 같으면 캐시 적중. 자료가 바뀌면 버전이 달라져 자동으로 새로 계산한다.
 * 캐시는 같은 서버 인스턴스 안에서만 산다(Vercel Fluid compute 는 인스턴스를 재사용하므로
 * 직원 여러 명의 새로고침·정렬·페이지 이동이 대부분 적중한다). 첫 열기는 여전히 계산한다.
 */

type VersionRow = {
  ingestion_id: bigint | null;
  record_at: Date | null;
  record_count: bigint;
  override_at: Date | null;
  override_count: bigint;
  account_at: Date | null;
};

const MAX_ENTRIES = 200;
const MAX_AGE_MS = 30 * 60 * 1000;

type CacheEntry = { version: string; expiresAt: number; value: unknown };

const globalForCache = globalThis as unknown as {
  __workbenchResultCache?: Map<string, CacheEntry>;
};

function getStore(): Map<string, CacheEntry> {
  if (!globalForCache.__workbenchResultCache) {
    globalForCache.__workbenchResultCache = new Map();
  }
  return globalForCache.__workbenchResultCache;
}

function toKey(value: Date | bigint | null): string {
  if (value === null) return "-";
  return typeof value === "bigint" ? value.toString() : String(value.getTime());
}

/** 선택 계정들의 자료 버전 문자열. 원천 표 중 하나라도 바뀌면 달라진다. */
export async function getWorkbenchDataVersion(sellerIds: string[]): Promise<string> {
  const sellerIn = Prisma.join(sellerIds.map((id) => Prisma.sql`${id}`));
  // 템플릿·재고건강·샵플링 재고의 적재는 모두 ingestion_log 에 한 줄씩 남는다(작은 표, PK).
  // 큰 표 3개의 MAX(created_at)(색인 없음 → 전체 훑기, 수 초)를 이 한 값으로 대신한다 — 2026-10-27 2차.
  const rows = await prisma.$queryRaw<VersionRow[]>(Prisma.sql`
    SELECT
      (SELECT MAX(id) FROM ingestion_log) AS ingestion_id,
      (SELECT MAX(recorded_at) FROM coupang_inbound_record
        WHERE coupang_seller_account_id IN (${sellerIn})) AS record_at,
      (SELECT COUNT(*) FROM coupang_inbound_record
        WHERE coupang_seller_account_id IN (${sellerIn})) AS record_count,
      (SELECT MAX(updated_at) FROM inbound_planning_override
        WHERE coupang_seller_account_id IN (${sellerIn})) AS override_at,
      (SELECT COUNT(*) FROM inbound_planning_override
        WHERE coupang_seller_account_id IN (${sellerIn})) AS override_count,
      (SELECT MAX("updatedAt") FROM "CoupangSellerAccount"
        WHERE id IN (${sellerIn})) AS account_at
  `);
  const r = rows[0];
  if (!r) return "none";
  return [
    toKey(r.ingestion_id),
    toKey(r.record_at),
    toKey(r.record_count),
    toKey(r.override_at),
    toKey(r.override_count),
    toKey(r.account_at),
  ].join("|");
}

/**
 * key(조회 조건)·version(자료 버전)이 같으면 캐시 값을, 아니면 compute() 결과를 저장 후 돌려준다.
 */
export async function withWorkbenchResultCache<T>(
  key: string,
  version: string,
  compute: () => Promise<T>,
): Promise<{ value: T; hit: boolean }> {
  const store = getStore();
  const now = Date.now();
  const cached = store.get(key);

  if (cached && cached.version === version && cached.expiresAt > now) {
    // 최근 사용 순서 유지
    store.delete(key);
    store.set(key, cached);
    return { value: cached.value as T, hit: true };
  }

  const value = await compute();

  store.set(key, { version, expiresAt: now + MAX_AGE_MS, value });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }

  return { value, hit: false };
}

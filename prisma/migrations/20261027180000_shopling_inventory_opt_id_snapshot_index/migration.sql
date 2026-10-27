-- 샵플링 「신규 옵션 상품」 화면 느림(6~7초) 수리, 2026-10-27.
-- 그 화면은 shopling_inventory 전체에서 opt_id 별 첫 등장일(MIN(snapshot_date))을 구하고
-- 다시 opt_id + snapshot_date 로 자기 표와 맞붙인다. opt_id 에 색인이 없어 매번 전체를 훑었다.
-- (opt_id, snapshot_date) 색인 하나로 둘 다 색인만 읽어 끝난다. 파괴적 변경 아님.
-- 적용: DB 접근이 있는 곳에서 `npx prisma migrate deploy` (Vercel 빌드는 마이그레이션을 돌리지 않음).

CREATE INDEX IF NOT EXISTS "idx_shopling_inv_opt_id_snapshot"
  ON "shopling_inventory" ("opt_id", "snapshot_date");

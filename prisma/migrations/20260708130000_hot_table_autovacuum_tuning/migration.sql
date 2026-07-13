-- 대시보드/워크벤치 성능 회귀 방지.
--
-- template/health/shopling_inventory는 매일 스냅샷이 append 되는 insert-heavy
-- 테이블이다. 기본 autovacuum은 UPDATE/DELETE 위주로 동작하고 insert 기반
-- 트리거(autovacuum_vacuum_insert_scale_factor 기본 0.2)가 느슨해, 매일 수천~
-- 수만 행이 쌓여도 한동안 VACUUM이 돌지 않는다. 그러면 visibility map이 노후화되어
-- index-only scan이 heap을 다시 읽고(heap fetches), 뷰/워크벤치 쿼리가 급격히
-- 느려진다(측정상 count 뷰 890ms, seller 쿼리도 수백 ms).
--
-- 아래 설정으로 insert가 조금만 쌓여도 autovacuum이 자주 돌아 visibility map과
-- 통계를 신선하게 유지한다(파괴적 변경 아님, 즉시 적용).

ALTER TABLE "coupang_growth_inbound_template" SET (
  autovacuum_vacuum_insert_scale_factor = 0.05,
  autovacuum_vacuum_insert_threshold = 1000,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_scale_factor = 0.05
);

ALTER TABLE "coupang_growth_inventory_health" SET (
  autovacuum_vacuum_insert_scale_factor = 0.05,
  autovacuum_vacuum_insert_threshold = 1000,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_scale_factor = 0.05
);

ALTER TABLE "shopling_inventory" SET (
  autovacuum_vacuum_insert_scale_factor = 0.05,
  autovacuum_vacuum_insert_threshold = 1000,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_scale_factor = 0.05
);

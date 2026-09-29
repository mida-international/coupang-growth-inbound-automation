-- 쿠팡 입고 기록하기 중복 방지: 업로드한 원본 파일(엑셀/이미지)의 해시와 원본 파일 정보를 저장한다.
-- 같은 계정에 같은 원본으로 기록된 적이 있으면 기록 전에 경고한다.
-- 기존 기록은 NULL 유지(중복 확인 대상 아님), 신규 기록부터 채워진다.

ALTER TABLE "coupang_inbound_deliverable" ADD COLUMN IF NOT EXISTS "source_fingerprint" TEXT;
ALTER TABLE "coupang_inbound_deliverable" ADD COLUMN IF NOT EXISTS "source_files" JSONB;

CREATE INDEX IF NOT EXISTS "idx_coupang_inbound_deliverable_seller_fingerprint"
  ON "coupang_inbound_deliverable" ("coupang_seller_account_id", "source_fingerprint");

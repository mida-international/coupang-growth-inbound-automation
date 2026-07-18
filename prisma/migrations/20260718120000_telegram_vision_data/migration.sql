-- 텔레그램 OCR 원본 인식 데이터(신뢰도 포함) 저장.
-- 자동화 > 텔레그램의 쿠팡 템플릿 패널에서 인식결과 미리보기를 제공하기 위함.
-- 기존 기록은 NULL 유지(미리보기 없음), 신규 완료 건부터 채워진다.

ALTER TABLE "telegram_box_list_upload" ADD COLUMN IF NOT EXISTS "vision_data" JSONB;

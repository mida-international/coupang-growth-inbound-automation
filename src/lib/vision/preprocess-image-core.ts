/**
 * 빨간 채널 전처리의 순수 로직(sharp·server-only 의존 없음) — 단위 테스트 대상.
 * 실제 이미지 인코딩/디코딩은 preprocess-image.ts 가 담당한다.
 */

/** 빨강으로 판정할 최소 redness(R - max(G,B)). 흐린 펜 빨강도 보통 60~90이라 넉넉히 잡힌다. */
export const DEFAULT_REDNESS_THRESHOLD = 40;
/** 강조할 빨강 색(진한 빨강). 흐린 빨간 0/취소선을 어둡게 키워 축소 후에도 살아남게 한다. */
export const ENHANCED_RED: [number, number, number] = [170, 12, 12];

/** 환경변수 VISION_RED_PREPROCESS 로 on/off. 기본 on, "off/0/false/no" 면 끈다. */
export function isRedPreprocessEnabled(): boolean {
  const value = process.env.VISION_RED_PREPROCESS?.trim().toLowerCase();
  return value !== "off" && value !== "0" && value !== "false" && value !== "no";
}

/** 환경변수 VISION_RED_PREPROCESS_THRESHOLD 로 민감도 조절(양수). 기본 40. */
export function getRednessThreshold(): number {
  const raw = Number(process.env.VISION_RED_PREPROCESS_THRESHOLD);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_REDNESS_THRESHOLD;
}

/**
 * 빨간 잉크 픽셀(redness > threshold)만 진한 빨강으로 덮어쓴다. 나머지(검은 글자·바코드·
 * 배경)는 그대로 둔다. 버퍼를 제자리에서 수정하고 바꾼 픽셀 수를 반환한다.
 */
export function recolorRedPixels(
  data: Uint8Array,
  channels: number,
  threshold: number,
): number {
  let recolored = 0;

  for (let p = 0; p < data.length; p += channels) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];

    if (r - Math.max(g, b) > threshold) {
      data[p] = ENHANCED_RED[0];
      data[p + 1] = ENHANCED_RED[1];
      data[p + 2] = ENHANCED_RED[2];

      if (channels === 4) {
        data[p + 3] = 255;
      }

      recolored += 1;
    }
  }

  return recolored;
}

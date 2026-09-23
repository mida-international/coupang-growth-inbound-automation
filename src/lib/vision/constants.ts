export const VISION_MAX_IMAGES = 5;
export const VISION_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const VISION_LOW_CONFIDENCE_THRESHOLD = 0.7;

// 숫자 오인식(2↔5 등)을 줄이기 위해 각 계열의 상위 모델을 쓴다.
export const DEFAULT_GEMINI_VISION_MODEL = "gemini-2.5-pro";
export const DEFAULT_ANTHROPIC_VISION_MODEL = "claude-opus-5";
// Claude가 정책상 응답을 거절(refusal)하면 서버에서 이 모델로 다시 실행한다.
export const ANTHROPIC_VISION_FALLBACK_MODEL = "claude-opus-4-8";

// 작은 숫자를 크게 보여주기 위해 원본과 함께 보내는 가로 띠(확대) 이미지 설정.
export const VISION_STRIP_COUNT = 3;
export const VISION_STRIP_OVERLAP_RATIO = 0.12;
// Claude 고해상도 비전의 긴 변 최대치. 이보다 크면 API가 축소하므로 미리 맞춘다.
export const VISION_MAX_EDGE_PX = 2576;

export function getGeminiVisionModel(): string {
  return process.env.GEMINI_VISION_MODEL?.trim() || DEFAULT_GEMINI_VISION_MODEL;
}

export function getAnthropicVisionModel(): string {
  return (
    process.env.ANTHROPIC_VISION_MODEL?.trim() || DEFAULT_ANTHROPIC_VISION_MODEL
  );
}

export function assertVisionApiKeysConfigured(): void {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error(
      "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Vercel 설정 후 재배포해 주세요.",
    );
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new Error(
      "ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다. Vercel 설정 후 재배포해 주세요.",
    );
  }
}

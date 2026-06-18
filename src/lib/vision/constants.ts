export const VISION_MAX_IMAGES = 5;
export const VISION_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const VISION_LOW_CONFIDENCE_THRESHOLD = 0.7;

export const DEFAULT_GEMINI_VISION_MODEL = "gemini-2.5-flash";
export const DEFAULT_ANTHROPIC_VISION_MODEL = "claude-sonnet-4-20250514";

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

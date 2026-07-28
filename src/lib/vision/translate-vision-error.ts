/**
 * Gemini/Claude 원본 오류 메시지가 사용자에게 그대로 노출되지 않도록
 * 한국어 안내 문구로 변환한다. 원본 오류는 호출부에서 logRouteError로 남는다.
 */

export const VISION_BUSY_MESSAGE =
  "이미지 분석 AI가 일시적으로 혼잡합니다. 1~2분 후 다시 시도해 주세요.";

export const VISION_GENERIC_MESSAGE =
  "이미지 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

const BUSY_PATTERN =
  /\b(429|500|502|503|504)\b|overload|high demand|unavailable|rate.?limit|resource.?exhausted|temporar|timeout|ECONNRESET|ETIMEDOUT|fetch failed/i;

const PROVIDER_PATTERN = /GoogleGenerativeAI|generativelanguage|anthropic/i;

const DETAIL_MAX_LENGTH = 300;

export function translateVisionError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (PROVIDER_PATTERN.test(message)) {
    if (BUSY_PATTERN.test(message)) {
      return new Error(VISION_BUSY_MESSAGE);
    }

    // 기타 AI 오류는 문의 대응이 가능하도록 원본 메시지를 함께 보여준다.
    const detail =
      message.length > DETAIL_MAX_LENGTH
        ? `${message.slice(0, DETAIL_MAX_LENGTH)}…`
        : message;

    return new Error(`${VISION_GENERIC_MESSAGE}\n\n상세: ${detail}`);
  }

  // 한국어 도메인 오류(설정 누락, 빈 응답 안내 등)는 그대로 전달한다.
  return error instanceof Error ? error : new Error(VISION_GENERIC_MESSAGE);
}

import { GoogleGenerativeAI } from "@google/generative-ai";

import { getGeminiVisionModel } from "@/lib/vision/constants";
import {
  EXTRACT_BOX_LIST_SYSTEM_PROMPT,
  buildExtractUserPrompt,
} from "@/lib/vision/prompts/extract-box-list-prompt";
import { parseVisionJsonResponse, type ParsedVisionPayload } from "@/lib/vision/parse-vision-json";
import type { PreparedVisionImageSet } from "@/lib/vision/prepare-vision-images";

export type VisionImageInput = {
  buffer: Buffer;
  mimeType: string;
};

/** 일시적 서버 오류(503/429/네트워크)면 지수 백오프로 재시도한다. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retriable =
        /\b(429|500|502|503|504)\b|overload|unavailable|rate.?limit|temporar|timeout|fetch|ECONNRESET|ETIMEDOUT/i.test(
          message,
        );

      if (!retriable || attempt === attempts - 1) {
        throw error;
      }

      // 1s, 2s, 4s 백오프
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }

  throw lastError;
}

/** 원본 페이지 + 가로 띠 확대본을 한 번에 넣어 이미지 한 장을 판독한 결과를 돌려준다. */
export async function extractImageWithGemini(
  image: PreparedVisionImageSet,
): Promise<ParsedVisionPayload> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: getGeminiVisionModel(),
    systemInstruction: EXTRACT_BOX_LIST_SYSTEM_PROMPT,
    // temperature 0: 같은 이미지를 같은 결과로 읽게 해 취소(0) 인식이
    // 실행마다 달라지는 것을 막는다.
    generationConfig: { temperature: 0 },
  });

  const result = await withRetry(() =>
    model.generateContent([
      buildExtractUserPrompt(image.strips.length),
      ...[image.full, ...image.strips].map((part) => ({
        inlineData: { mimeType: part.mimeType, data: part.base64 },
      })),
    ]),
  );

  const text = result.response.text();

  if (!text?.trim()) {
    throw new Error("Gemini가 빈 응답을 반환했습니다.");
  }

  return parseVisionJsonResponse(text);
}

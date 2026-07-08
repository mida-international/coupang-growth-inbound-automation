import { GoogleGenerativeAI } from "@google/generative-ai";

import { getGeminiVisionModel } from "@/lib/vision/constants";
import {
  EXTRACT_BOX_LIST_SYSTEM_PROMPT,
  buildGeminiExtractUserPrompt,
} from "@/lib/vision/prompts/extract-box-list-prompt";
import { parseVisionJsonResponse, type ParsedVisionPayload } from "@/lib/vision/parse-vision-json";

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

async function extractSingleImage(
  client: GoogleGenerativeAI,
  image: VisionImageInput,
  imageIndex: number,
  total: number,
): Promise<ParsedVisionPayload> {
  const model = client.getGenerativeModel({
    model: getGeminiVisionModel(),
    systemInstruction: EXTRACT_BOX_LIST_SYSTEM_PROMPT,
  });

  const result = await withRetry(() =>
    model.generateContent([
      buildGeminiExtractUserPrompt(imageIndex, total),
      {
        inlineData: {
          mimeType: image.mimeType,
          data: image.buffer.toString("base64"),
        },
      },
    ]),
  );

  const text = result.response.text();

  if (!text?.trim()) {
    throw new Error("Gemini가 빈 응답을 반환했습니다.");
  }

  return parseVisionJsonResponse(text);
}

export async function extractWithGemini(
  images: VisionImageInput[],
): Promise<ParsedVisionPayload[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const client = new GoogleGenerativeAI(apiKey);

  // 이미지별로 병렬 처리 (순차로 하면 장수가 늘수록 함수 타임아웃에 걸린다).
  return Promise.all(
    images.map((image, index) =>
      extractSingleImage(client, image, index, images.length),
    ),
  );
}

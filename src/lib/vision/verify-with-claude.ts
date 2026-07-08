import Anthropic from "@anthropic-ai/sdk";

import { getAnthropicVisionModel } from "@/lib/vision/constants";
import {
  EXTRACT_BOX_LIST_SYSTEM_PROMPT,
  buildClaudeVerifyUserPrompt,
} from "@/lib/vision/prompts/extract-box-list-prompt";
import { parseVisionJsonResponse, type ParsedVisionPayload } from "@/lib/vision/parse-vision-json";
import type { VisionImageInput } from "@/lib/vision/extract-with-gemini";

/** 일시적 오류(429/5xx/네트워크)면 지수 백오프로 재시도한다. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retriable =
        /\b(429|500|502|503|504|529)\b|overload|unavailable|rate.?limit|temporar|timeout|fetch|ECONNRESET|ETIMEDOUT/i.test(
          message,
        );

      if (!retriable || attempt === attempts - 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }

  throw lastError;
}

/**
 * 이미지 한 장을, 그 이미지의 Gemini 추출 결과와 대조해 검증/보정한다.
 * 여러 장이면 호출하는 쪽에서 장별로 이 함수를 호출한 뒤 결과 행을 이어 붙인다
 * (한 번의 호출에 여러 이미지를 넣으면 모델이 일부 이미지의 행을 누락시킨다).
 */
export async function verifyImageWithClaude(
  geminiResult: ParsedVisionPayload,
  image: VisionImageInput,
): Promise<ParsedVisionPayload> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  }

  const client = new Anthropic({ apiKey });
  const geminiJson = JSON.stringify(geminiResult);

  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [
    {
      type: "text",
      text: buildClaudeVerifyUserPrompt(geminiJson, 1),
    },
    {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: image.mimeType as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
        data: image.buffer.toString("base64"),
      },
    },
  ];

  const response = await withRetry(() =>
    client.messages.create({
      model: getAnthropicVisionModel(),
      max_tokens: 16000,
      system: EXTRACT_BOX_LIST_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
  );

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text" || !textBlock.text.trim()) {
    throw new Error("Claude 검증 응답이 비어 있습니다.");
  }

  return parseVisionJsonResponse(textBlock.text);
}

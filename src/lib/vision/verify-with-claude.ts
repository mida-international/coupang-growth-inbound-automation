import Anthropic from "@anthropic-ai/sdk";

import { getAnthropicVisionModel } from "@/lib/vision/constants";
import {
  EXTRACT_BOX_LIST_SYSTEM_PROMPT,
  buildClaudeVerifyUserPrompt,
} from "@/lib/vision/prompts/extract-box-list-prompt";
import { parseVisionJsonResponse, type ParsedVisionPayload } from "@/lib/vision/parse-vision-json";
import type { VisionImageInput } from "@/lib/vision/extract-with-gemini";

export async function verifyWithClaude(
  geminiResults: ParsedVisionPayload[],
  images: VisionImageInput[],
): Promise<ParsedVisionPayload> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  }

  const client = new Anthropic({ apiKey });
  const geminiJson = JSON.stringify(
    geminiResults.length === 1
      ? geminiResults[0]
      : { images: geminiResults },
  );

  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [
    {
      type: "text",
      text: buildClaudeVerifyUserPrompt(geminiJson, images.length),
    },
    ...images.map((image) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: image.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: image.buffer.toString("base64"),
      },
    })),
  ];

  const response = await client.messages.create({
    model: getAnthropicVisionModel(),
    max_tokens: 16000,
    system: EXTRACT_BOX_LIST_SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text" || !textBlock.text.trim()) {
    throw new Error("Claude 검증 응답이 비어 있습니다.");
  }

  return parseVisionJsonResponse(textBlock.text);
}

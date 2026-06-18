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

  const result = await model.generateContent([
    buildGeminiExtractUserPrompt(imageIndex, total),
    {
      inlineData: {
        mimeType: image.mimeType,
        data: image.buffer.toString("base64"),
      },
    },
  ]);

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
  const results: ParsedVisionPayload[] = [];

  for (let index = 0; index < images.length; index += 1) {
    results.push(await extractSingleImage(client, images[index], index, images.length));
  }

  return results;
}

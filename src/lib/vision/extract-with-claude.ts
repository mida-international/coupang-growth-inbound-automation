import Anthropic from "@anthropic-ai/sdk";

import {
  ANTHROPIC_VISION_FALLBACK_MODEL,
  getAnthropicVisionModel,
} from "@/lib/vision/constants";
import { parseVisionJsonResponse, type ParsedVisionPayload } from "@/lib/vision/parse-vision-json";
import type { PreparedVisionImageSet } from "@/lib/vision/prepare-vision-images";
import {
  EXTRACT_BOX_LIST_SYSTEM_PROMPT,
  buildArbitrationUserPrompt,
  buildExtractUserPrompt,
} from "@/lib/vision/prompts/extract-box-list-prompt";
import type {
  VisionArbitrationDecision,
  VisionDispute,
} from "@/lib/vision/reconcile-vision-results";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  }

  // SDK 가 429/5xx/네트워크 오류를 지수 백오프로 재시도한다.
  return new Anthropic({ apiKey, maxRetries: 4 });
}

function imageBlocks(
  image: PreparedVisionImageSet,
): Anthropic.Beta.BetaImageBlockParam[] {
  return [image.full, ...image.strips].map((part) => ({
    type: "image",
    source: { type: "base64", media_type: part.mimeType, data: part.base64 },
  }));
}

/**
 * 이미지 + 지시문으로 Claude 를 호출해 최종 텍스트를 돌려준다.
 * 사고(thinking)가 길어질 수 있어 스트리밍으로 받아 타임아웃을 피한다.
 */
async function callClaude(
  image: PreparedVisionImageSet,
  prompt: string,
  effort: Effort,
): Promise<string> {
  const response = await createClient()
    .beta.messages.stream({
      model: getAnthropicVisionModel(),
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: { effort },
      // 정책상 거절(refusal) 시 같은 요청을 서버에서 대체 모델로 다시 실행한다.
      betas: ["server-side-fallback-2026-06-01"],
      fallbacks: [{ model: ANTHROPIC_VISION_FALLBACK_MODEL }],
      system: EXTRACT_BOX_LIST_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [...imageBlocks(image), { type: "text", text: prompt }],
        },
      ],
    })
    .finalMessage();

  if (response.stop_reason === "refusal") {
    throw new Error("Claude가 이미지 분석을 거절했습니다.");
  }

  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude 응답이 길이 제한으로 잘렸습니다.");
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text) {
    throw new Error("Claude 응답이 비어 있습니다.");
  }

  return text;
}

/** Gemini 와 독립적으로 이미지 한 장을 판독한다 (서로의 결과를 보지 않아야 교차검증이 의미 있다). */
export async function extractImageWithClaude(
  image: PreparedVisionImageSet,
): Promise<ParsedVisionPayload> {
  const text = await callClaude(
    image,
    buildExtractUserPrompt(image.strips.length),
    // 행이 많은 표는 출력이 길어 high 이상이면 함수 제한 시간(300s)에 걸릴 수 있다.
    "medium",
  );

  return parseVisionJsonResponse(text);
}

/** 두 판독이 어긋난 행만 확대 이미지로 다시 보고 최종 값을 정한다. */
export async function arbitrateWithClaude(
  image: PreparedVisionImageSet,
  disputes: VisionDispute[],
): Promise<VisionArbitrationDecision[]> {
  const disputesJson = JSON.stringify(
    disputes.map((dispute) => ({
      id: dispute.id,
      a: pickFields(dispute.a),
      b: pickFields(dispute.b),
    })),
    null,
    2,
  );
  const text = await callClaude(
    image,
    buildArbitrationUserPrompt(disputesJson, image.strips.length),
    "high",
  );

  return parseArbitrationResponse(text);
}

function pickFields(row: Record<string, string> | null) {
  if (!row) {
    return null;
  }

  return {
    location: row.location ?? "",
    등록상품명: row["등록상품명"] ?? "",
    옵션: row["옵션"] ?? "",
    바코드: row["바코드"] ?? "",
    수량: row["수량"] ?? "",
    printedQty: row.printedQty ?? "",
  };
}

export function parseArbitrationResponse(
  raw: string,
): VisionArbitrationDecision[] {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end <= start) {
    throw new Error("Claude 재판정 응답에서 JSON을 찾지 못했습니다.");
  }

  const parsed = JSON.parse(raw.slice(start, end + 1)) as {
    decisions?: unknown;
  };

  if (!Array.isArray(parsed.decisions)) {
    throw new Error("Claude 재판정 응답에 decisions가 없습니다.");
  }

  return parsed.decisions
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      id: String(item.id ?? ""),
      exists: item.exists !== false,
      바코드: String(item["바코드"] ?? "").replace(/\s/g, ""),
      수량: String(item["수량"] ?? "").trim(),
      printedQty: String(item.printedQty ?? "").trim(),
    }))
    .filter((decision) => decision.id);
}

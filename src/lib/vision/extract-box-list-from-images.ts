import "server-only";

import { assertVisionApiKeysConfigured } from "@/lib/vision/constants";
import {
  arbitrateWithClaude,
  extractImageWithClaude,
} from "@/lib/vision/extract-with-claude";
import {
  extractImageWithGemini,
  type VisionImageInput,
} from "@/lib/vision/extract-with-gemini";
import { mergeVisionPayloads } from "@/lib/vision/merge-vision-results";
import { computeVisionStats } from "@/lib/vision/compute-vision-stats";
import type { ParsedVisionPayload } from "@/lib/vision/parse-vision-json";
import { prepareVisionImages } from "@/lib/vision/prepare-vision-images";
import {
  applyArbitration,
  reconcileVisionRows,
} from "@/lib/vision/reconcile-vision-results";
import { translateVisionError } from "@/lib/vision/translate-vision-error";
import type { VisionExtractResult } from "@/lib/vision/types";

export type { VisionImageInput };

/**
 * 이미지 한 장 판독:
 * 1) 원본 + 가로 띠 확대본 준비
 * 2) Claude·Gemini 가 서로의 결과를 보지 않고 독립 판독 (병렬)
 * 3) 바코드 기준으로 대조해 수량이 다르거나 한쪽에만 있는 행만 Claude 가 재판정
 *    → 재판정한 행은 저신뢰로 표시해 사람이 확인하게 한다.
 * 한쪽 모델이 실패하면 나머지 한쪽 결과만 쓴다.
 */
async function extractSingleImage(
  input: VisionImageInput,
): Promise<ParsedVisionPayload> {
  const image = await prepareVisionImages(input.buffer);
  const [claudeResult, geminiResult] = await Promise.allSettled([
    extractImageWithClaude(image),
    extractImageWithGemini(image),
  ]);

  if (claudeResult.status === "rejected" && geminiResult.status === "rejected") {
    throw claudeResult.reason;
  }

  if (claudeResult.status === "rejected") {
    console.error("[vision] Claude 판독 실패 — Gemini 결과만 사용:", claudeResult.reason);
    return (geminiResult as PromiseFulfilledResult<ParsedVisionPayload>).value;
  }

  if (geminiResult.status === "rejected") {
    console.error("[vision] Gemini 판독 실패 — Claude 결과만 사용:", geminiResult.reason);
    return claudeResult.value;
  }

  const primary = claudeResult.value;
  const reconciled = reconcileVisionRows(primary.rows, geminiResult.value.rows);
  let decisions: Awaited<ReturnType<typeof arbitrateWithClaude>> = [];

  if (reconciled.disputes.length > 0) {
    try {
      decisions = await arbitrateWithClaude(image, reconciled.disputes);
    } catch (error) {
      // 재판정이 실패해도 판독 결과는 쓸 수 있다 (해당 행은 저신뢰로 남는다).
      console.error("[vision] 이견 재판정 실패:", error);
    }
  }

  return {
    columns: primary.columns,
    rows: applyArbitration(reconciled, decisions),
    metadata: {
      boxNumbers: Array.from(
        new Set([
          ...(primary.metadata?.boxNumbers ?? []),
          ...(geminiResult.value.metadata?.boxNumbers ?? []),
        ]),
      ),
    },
  };
}

export async function extractBoxListFromImages(
  images: VisionImageInput[],
): Promise<VisionExtractResult> {
  assertVisionApiKeysConfigured();

  if (images.length === 0) {
    throw new Error("분석할 이미지가 없습니다.");
  }

  // 이미지별로 따로 판독한 뒤 순서대로(1번 아래 2번…) 이어 붙인다.
  // 여러 이미지를 한 번에 넣으면 모델이 일부 이미지의 행을 누락시키고,
  // 순차 처리하면 장수가 늘수록 함수 제한 시간에 걸리므로 병렬로 처리한다.
  let results: ParsedVisionPayload[];

  try {
    results = await Promise.all(images.map(extractSingleImage));
  } catch (error) {
    console.error("[vision] 이미지 분석 실패 (원본 오류):", error);
    throw translateVisionError(error);
  }

  const merged = mergeVisionPayloads(results);

  const visionData = {
    columns: merged.columns,
    rows: merged.rows,
  };

  const stats = computeVisionStats(visionData, {
    imageCount: images.length,
    boxNumbers: merged.boxNumbers,
  });

  return { visionData, stats };
}

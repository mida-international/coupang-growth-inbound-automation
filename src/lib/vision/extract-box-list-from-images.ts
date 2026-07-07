import "server-only";

import { assertVisionApiKeysConfigured } from "@/lib/vision/constants";
import {
  extractWithGemini,
  type VisionImageInput,
} from "@/lib/vision/extract-with-gemini";
import { mergeVisionPayloads } from "@/lib/vision/merge-vision-results";
import { computeVisionStats } from "@/lib/vision/compute-vision-stats";
import type { ParsedVisionPayload } from "@/lib/vision/parse-vision-json";
import { verifyImageWithClaude } from "@/lib/vision/verify-with-claude";
import type { VisionExtractResult } from "@/lib/vision/types";

export type { VisionImageInput };

export async function extractBoxListFromImages(
  images: VisionImageInput[],
): Promise<VisionExtractResult> {
  assertVisionApiKeysConfigured();

  if (images.length === 0) {
    throw new Error("분석할 이미지가 없습니다.");
  }

  // 1) 이미지별 Gemini 추출 → 2) 이미지별 Claude 검증 → 3) 모든 이미지의 행을
  // 순서대로(1번 아래 2번…) 그대로 이어 붙인다. 여러 이미지를 한 번에 검증하면
  // 모델이 일부 이미지 행을 누락시키므로, 반드시 장별로 검증한 뒤 merge 한다.
  const geminiResults = await extractWithGemini(images);

  const verifiedResults: ParsedVisionPayload[] = [];

  for (let index = 0; index < images.length; index += 1) {
    verifiedResults.push(
      await verifyImageWithClaude(geminiResults[index], images[index]),
    );
  }

  const merged = mergeVisionPayloads(verifiedResults);

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

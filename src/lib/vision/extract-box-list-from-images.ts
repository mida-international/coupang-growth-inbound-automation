import "server-only";

import { assertVisionApiKeysConfigured } from "@/lib/vision/constants";
import {
  extractWithGemini,
  type VisionImageInput,
} from "@/lib/vision/extract-with-gemini";
import { mergeVisionPayloads } from "@/lib/vision/merge-vision-results";
import { computeVisionStats } from "@/lib/vision/compute-vision-stats";
import { verifyWithClaude } from "@/lib/vision/verify-with-claude";
import type { VisionExtractResult } from "@/lib/vision/types";

export type { VisionImageInput };

export async function extractBoxListFromImages(
  images: VisionImageInput[],
): Promise<VisionExtractResult> {
  assertVisionApiKeysConfigured();

  if (images.length === 0) {
    throw new Error("분석할 이미지가 없습니다.");
  }

  const geminiResults = await extractWithGemini(images);
  const verified = await verifyWithClaude(geminiResults, images);
  const merged = mergeVisionPayloads([verified]);

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

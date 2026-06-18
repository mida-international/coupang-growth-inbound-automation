import "server-only";

import {
  VISION_MAX_IMAGE_BYTES,
  VISION_MAX_IMAGES,
} from "@/lib/vision/constants";
import type { VisionImageInput } from "@/lib/vision/extract-with-gemini";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function readVisionImageFiles(
  formData: FormData,
): Promise<VisionImageInput[]> {
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    throw new Error("이미지 파일을 1장 이상 선택해 주세요.");
  }

  if (files.length > VISION_MAX_IMAGES) {
    throw new Error(`이미지는 최대 ${VISION_MAX_IMAGES}장까지 업로드할 수 있습니다.`);
  }

  const images: VisionImageInput[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/") || !ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error(`지원하지 않는 이미지 형식입니다: ${file.name}`);
    }

    if (file.size > VISION_MAX_IMAGE_BYTES) {
      throw new Error(
        `이미지 크기는 ${Math.floor(VISION_MAX_IMAGE_BYTES / 1024 / 1024)}MB 이하여야 합니다: ${file.name}`,
      );
    }

    images.push({
      buffer: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
    });
  }

  return images;
}

export function parseVisionDataJson(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error("visionData JSON이 필요합니다.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("visionData JSON 형식이 올바르지 않습니다.");
  }
}

export function assertVisionExtractedData(
  value: unknown,
): import("@/lib/vision/types").VisionExtractedData {
  if (
    typeof value !== "object" ||
    value === null ||
    !Array.isArray((value as { columns?: unknown }).columns) ||
    !Array.isArray((value as { rows?: unknown }).rows)
  ) {
    throw new Error("visionData 형식이 올바르지 않습니다.");
  }

  return value as import("@/lib/vision/types").VisionExtractedData;
}

import sharp from "sharp";

import {
  VISION_MAX_EDGE_PX,
  VISION_STRIP_COUNT,
  VISION_STRIP_OVERLAP_RATIO,
} from "@/lib/vision/constants";

export type PreparedVisionImage = {
  mimeType: "image/jpeg";
  base64: string;
};

export type PreparedVisionImageSet = {
  /** 표 전체 구조(행 순서)를 보기 위한 원본 페이지 */
  full: PreparedVisionImage;
  /** 위→아래 순서의 가로 띠 확대본. 작은 숫자를 읽기 위한 보조 이미지 */
  strips: PreparedVisionImage[];
};

export type StripBounds = { top: number; height: number };

/**
 * 페이지를 위→아래로 겹치게 나눈 띠의 좌표를 계산한다.
 * 띠 경계에 걸친 행이 잘리지 않도록 인접 띠끼리 일정 비율 겹친다.
 */
export function computeStripBounds(
  imageHeight: number,
  count = VISION_STRIP_COUNT,
  overlapRatio = VISION_STRIP_OVERLAP_RATIO,
): StripBounds[] {
  if (count <= 1 || imageHeight <= 0) {
    return [{ top: 0, height: Math.max(0, imageHeight) }];
  }

  const baseHeight = imageHeight / count;
  const overlap = Math.round(baseHeight * overlapRatio);

  return Array.from({ length: count }, (_, index) => {
    const top = Math.max(0, Math.round(baseHeight * index) - overlap);
    const bottom = Math.min(
      imageHeight,
      Math.round(baseHeight * (index + 1)) + overlap,
    );

    return { top, height: bottom - top };
  });
}

async function toJpeg(pipeline: sharp.Sharp): Promise<PreparedVisionImage> {
  const buffer = await pipeline.jpeg({ quality: 92 }).toBuffer();

  return { mimeType: "image/jpeg", base64: buffer.toString("base64") };
}

/**
 * OCR 입력 이미지를 준비한다.
 * - EXIF 회전을 적용하고, 긴 변이 모델 최대 해상도를 넘으면 축소한다.
 * - 가로 띠 확대본은 원본 해상도에서 잘라 긴 변을 최대 해상도까지 키운다
 *   (띠는 가로로 길어서 결과적으로 글자가 2~3배 커진다).
 */
export async function prepareVisionImages(
  buffer: Buffer,
): Promise<PreparedVisionImageSet> {
  const rotated = await sharp(buffer).rotate().toBuffer();
  const { width = 0, height = 0 } = await sharp(rotated).metadata();

  if (!width || !height) {
    throw new Error("이미지 크기를 읽지 못했습니다.");
  }

  const full = await toJpeg(
    sharp(rotated).resize({
      width: VISION_MAX_EDGE_PX,
      height: VISION_MAX_EDGE_PX,
      fit: "inside",
      withoutEnlargement: true,
    }),
  );

  const strips = await Promise.all(
    computeStripBounds(height).map((bounds) =>
      toJpeg(
        sharp(rotated)
          .extract({ left: 0, top: bounds.top, width, height: bounds.height })
          .resize({
            width: VISION_MAX_EDGE_PX,
            height: VISION_MAX_EDGE_PX,
            fit: "inside",
            kernel: "lanczos3",
          }),
      ),
    ),
  );

  return { full, strips };
}

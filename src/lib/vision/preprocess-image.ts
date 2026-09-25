import "server-only";

import sharp from "sharp";

import {
  getRednessThreshold,
  isRedPreprocessEnabled,
  recolorRedPixels,
} from "@/lib/vision/preprocess-image-core";

// 너무 큰 사진만 축소한다. 2576px = Claude opus 계열 고해상도 입력 상한(긴 변 기준)이라
// 바코드 같은 작은 글자를 최대한 또렷하게 유지하려고 이 값까지 허용한다(오독 최소화).
const MAX_DIMENSION = 2576;

export type PreprocessImageInput = { buffer: Buffer; mimeType: string };

/**
 * "강화 원본": 원본은 그대로 두고 빨간 표시(취소선/X/보정 숫자)만 진하게 키운 이미지를 만든다.
 * - 바코드·상품명·수량 등 검은 인쇄 정보는 손대지 않으므로 판독·매칭에 영향이 없다.
 * - 어떤 이유로든 실패하면 원본을 그대로 돌려준다(절대 throw 하지 않음).
 */
export async function enhanceRedMarks(
  image: PreprocessImageInput,
): Promise<PreprocessImageInput> {
  if (!isRedPreprocessEnabled()) {
    return image;
  }

  try {
    const { data, info } = await sharp(image.buffer, { failOn: "none" })
      .rotate() // EXIF 회전 반영
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    recolorRedPixels(data, info.channels, getRednessThreshold());

    const buffer = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    return { buffer, mimeType: "image/jpeg" };
  } catch (error) {
    console.error("[vision] 빨간 채널 전처리 실패 — 원본 사용:", error);
    return image;
  }
}

/** 여러 장을 병렬 전처리. 개별 실패는 그 장만 원본으로 대체된다. */
export async function enhanceRedMarksAll(
  images: PreprocessImageInput[],
): Promise<PreprocessImageInput[]> {
  return Promise.all(images.map((image) => enhanceRedMarks(image)));
}

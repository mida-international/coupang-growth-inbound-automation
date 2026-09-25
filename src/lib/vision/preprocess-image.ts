import "server-only";

import sharp from "sharp";

import {
  getRednessThreshold,
  isRedPreprocessEnabled,
  recolorRedPixels,
} from "@/lib/vision/preprocess-image-core";

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
      // EXIF 회전만 반영하고 해상도는 그대로 둔다. 축소는 prepareVisionImages 가
      // 원본 해상도에서 확대 띠를 자른 뒤에 하므로 여기서 줄이면 띠 화질이 떨어진다.
      .rotate()
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

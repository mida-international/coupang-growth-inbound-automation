import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  ENHANCED_RED,
  getRednessThreshold,
  isRedPreprocessEnabled,
  recolorRedPixels,
} from "@/lib/vision/preprocess-image-core";

describe("recolorRedPixels", () => {
  it("빨간 픽셀만 진한 빨강으로 바꾸고 나머지는 그대로 둔다", () => {
    // 3채널(RGB) 픽셀 4개: 흰색, 검정, 흐린 빨강, 선명한 빨강
    const data = new Uint8Array([
      255, 255, 255, // white
      10, 10, 10, // black (인쇄 글자)
      235, 140, 140, // 흐린 빨강 (redness 95 > 40)
      210, 30, 30, // 선명한 빨강
    ]);

    const recolored = recolorRedPixels(data, 3, 40);

    assert.equal(recolored, 2);
    // 흰색·검정은 불변
    assert.deepEqual([...data.slice(0, 3)], [255, 255, 255]);
    assert.deepEqual([...data.slice(3, 6)], [10, 10, 10]);
    // 빨강 두 개는 진한 빨강으로 교체
    assert.deepEqual([...data.slice(6, 9)], ENHANCED_RED);
    assert.deepEqual([...data.slice(9, 12)], ENHANCED_RED);
  });

  it("threshold 아래의 약한 빨강(따뜻한 종이색 등)은 건드리지 않는다", () => {
    // redness = 245 - 240 = 5 (크림색 종이) → threshold 40 미만이므로 유지
    const data = new Uint8Array([245, 240, 230]);

    const recolored = recolorRedPixels(data, 3, 40);

    assert.equal(recolored, 0);
    assert.deepEqual([...data], [245, 240, 230]);
  });

  it("4채널(RGBA)에서 알파를 불투명으로 유지한다", () => {
    const data = new Uint8Array([220, 30, 30, 128]);

    recolorRedPixels(data, 4, 40);

    assert.deepEqual([...data], [...ENHANCED_RED, 255]);
  });
});

describe("환경변수 스위치/민감도", () => {
  const original = {
    on: process.env.VISION_RED_PREPROCESS,
    th: process.env.VISION_RED_PREPROCESS_THRESHOLD,
  };

  afterEach(() => {
    process.env.VISION_RED_PREPROCESS = original.on;
    process.env.VISION_RED_PREPROCESS_THRESHOLD = original.th;
  });

  it("기본값은 켜짐, off/0/false/no 면 꺼진다", () => {
    delete process.env.VISION_RED_PREPROCESS;
    assert.equal(isRedPreprocessEnabled(), true);

    for (const value of ["off", "0", "false", "no", "OFF"]) {
      process.env.VISION_RED_PREPROCESS = value;
      assert.equal(isRedPreprocessEnabled(), false, `${value} → 꺼짐이어야 함`);
    }

    process.env.VISION_RED_PREPROCESS = "on";
    assert.equal(isRedPreprocessEnabled(), true);
  });

  it("threshold 는 양수 환경변수만 반영하고 아니면 기본 40", () => {
    delete process.env.VISION_RED_PREPROCESS_THRESHOLD;
    assert.equal(getRednessThreshold(), 40);

    process.env.VISION_RED_PREPROCESS_THRESHOLD = "60";
    assert.equal(getRednessThreshold(), 60);

    process.env.VISION_RED_PREPROCESS_THRESHOLD = "-5";
    assert.equal(getRednessThreshold(), 40);

    process.env.VISION_RED_PREPROCESS_THRESHOLD = "abc";
    assert.equal(getRednessThreshold(), 40);
  });
});

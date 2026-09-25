import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isValidBarcodeChecksum,
  normalizeBarcode,
} from "@/lib/vision/validate-barcode";

describe("isValidBarcodeChecksum", () => {
  it("실제 EAN-13 바코드는 전부 통과한다(오탐 0)", () => {
    const real = [
      "2016342654687",
      "2016341611186",
      "2000337559774",
      "2016342511980",
      "2016342411723",
      "2000333358500",
      "2016342582096",
      "2016342610669",
      "2016341954382",
      "2016342428714",
      "2016342453303",
      "2016342453310",
    ];

    for (const code of real) {
      assert.equal(isValidBarcodeChecksum(code), true, `${code} 는 유효해야 함`);
    }
  });

  it("OCR 오독 바코드는 검출한다(체크섬/길이 실패)", () => {
    // 한 자리 빠짐(13→12)
    assert.equal(isValidBarcodeChecksum("200033358500"), false);
    // 자릿값 변형(13자리지만 체크섬 불일치)
    assert.equal(isValidBarcodeChecksum("2016342533030"), false);
    assert.equal(isValidBarcodeChecksum("2016342533107"), false);
  });

  it("공백/하이픈을 무시하고 검증한다", () => {
    assert.equal(isValidBarcodeChecksum(" 2016342453303 "), true);
    assert.equal(isValidBarcodeChecksum("2016-342453303"), true);
    assert.equal(normalizeBarcode("2016 342 453303"), "2016342453303");
  });

  it("숫자가 아니거나 지원하지 않는 길이는 무효로 본다", () => {
    assert.equal(isValidBarcodeChecksum("abc"), false);
    assert.equal(isValidBarcodeChecksum("12345"), false); // 5자리
    assert.equal(isValidBarcodeChecksum(""), false);
  });
});

/**
 * 바코드 체크섬(GTIN) 검증 — OCR이 바코드 숫자를 잘못 읽었는지 코드로 잡아내기 위한 게이트.
 *
 * 이 판매자의 바코드는 전부 EAN-13(체크digit 포함) 규격이라, 체크섬이 맞지 않으면
 * 사실상 오독이다(예: 한 자리 빠짐 2000333358500→200033358500, 자릿값 바뀜 등).
 * server-only 의존이 없어 서버·클라이언트 양쪽에서 쓸 수 있다.
 */

/** 숫자만 남긴다(공백·하이픈 등 제거). */
export function normalizeBarcode(raw: string): string {
  return raw.trim().replace(/[^\d]/g, "");
}

/**
 * GTIN(EAN-8 / UPC-A / EAN-13 / GTIN-14) 체크섬 검증.
 * - 지원 길이(8·12·13·14)가 아니면 검증 불가로 보고 false(의심).
 * - 마지막 자리가 체크digit이며, 데이터 자리는 오른쪽부터 3·1·3·1… 가중.
 */
export function isValidBarcodeChecksum(raw: string): boolean {
  const code = normalizeBarcode(raw);

  if (![8, 12, 13, 14].includes(code.length)) {
    return false;
  }

  const digits = [...code].map((c) => c.charCodeAt(0) - 48);
  const check = digits[digits.length - 1];

  let sum = 0;
  for (let i = digits.length - 2; i >= 0; i -= 1) {
    const posFromRight = digits.length - 2 - i; // 0 = 가장 오른쪽 데이터 자리
    sum += digits[i] * (posFromRight % 2 === 0 ? 3 : 1);
  }

  return (10 - (sum % 10)) % 10 === check;
}

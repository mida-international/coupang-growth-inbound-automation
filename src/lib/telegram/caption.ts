export function matchesTelegramCaption(
  caption: string | undefined | null,
): boolean {
  // 특정 키워드를 요구하지 않는다. 캡션에 아무 내용이나 있으면 처리한다.
  return (caption?.trim().length ?? 0) > 0;
}

export function buildTelegramCaptionHint(): string {
  return "사진과 함께 캡션(아무 메모나)을 입력해 주세요. (예: 박스 17)";
}

export function resolveShoplingInboundErrorStatus(message: string): number {
  if (
    message.includes("미매핑") ||
    message.includes("모호한 매칭") ||
    message.includes("입고 템플릿에 넣을 샵플링 바코드가 없습니다")
  ) {
    return 422;
  }

  if (
    message.includes("[입고 리스트 오류]") ||
    message.includes("입고 리스트에서 유효한")
  ) {
    return 400;
  }

  return 500;
}

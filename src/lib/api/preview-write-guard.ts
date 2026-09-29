/**
 * 시험 사이트(Vercel 프리뷰)는 운영과 같은 DB·구글 시트를 쓴다.
 * 프리뷰에서 저장·기록·시트 반영이 운영 데이터에 들어가지 않도록 쓰기 API를 막는다.
 * (2026-09-25 프리뷰에서 창고전송용 다운로드로 운영 기록 1,280건이 저장된 사고 재발 방지)
 *
 * 파일만 만들어 돌려주는 POST(다운로드 생성·판독·중복 확인 등)는 데이터가 바뀌지 않으므로 허용한다.
 */
const READ_ONLY_POST_PATHS = new Set([
  "/api/coupang-growth-sync/detect-excel",
  "/api/coupang-inbound-deliverables/check-duplicates",
  "/api/downloads/coupang-inbound-template",
  "/api/downloads/coupang-inbound-template/from-image",
  "/api/downloads/shopling-inbound-original",
  "/api/downloads/shopling-inbound-template",
  "/api/downloads/shopling-outbound-template",
  "/api/integrations/shopling/test",
  "/api/vision/extract-box-list",
]);

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const PREVIEW_WRITE_BLOCKED_MESSAGE =
  "시험 사이트(프리뷰)에서는 저장·기록·시트 반영을 할 수 없습니다. 운영 사이트에서 진행해 주세요.";

export function isPreviewWriteBlocked(input: {
  vercelEnv: string | undefined;
  method: string;
  pathname: string;
}): boolean {
  if (input.vercelEnv !== "preview") {
    return false;
  }

  if (!input.pathname.startsWith("/api/")) {
    return false;
  }

  if (!WRITE_METHODS.has(input.method.toUpperCase())) {
    return false;
  }

  return !(
    input.method.toUpperCase() === "POST" &&
    READ_ONLY_POST_PATHS.has(input.pathname.replace(/\/+$/, ""))
  );
}

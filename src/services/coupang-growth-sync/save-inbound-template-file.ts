import {
  getInboundTemplateStoragePath,
  uploadExcelFile,
} from "@/lib/supabase/storage";

type SaveInboundTemplateFileInput = {
  coupangSellerAccountId: string;
  buffer: Buffer;
  sourceFileName: string;
};

export async function saveInboundTemplateFile(
  input: SaveInboundTemplateFileInput,
): Promise<void> {
  const path = getInboundTemplateStoragePath(input.coupangSellerAccountId);

  await uploadExcelFile(
    path,
    input.buffer,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // 판매자별 고정 경로를 덮어쓰는 "최신" 템플릿이라 CDN 캐시로 옛 파일이
    // 내려가면 "어제/오늘 변경분이 반영 안 되는" 문제가 생긴다. max-age=0으로
    // 매 요청 재검증시켜 항상 최신 업로드본을 받도록 한다.
    { cacheControl: "0" },
  );
}

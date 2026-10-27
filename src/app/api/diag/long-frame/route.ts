import { NextResponse } from "next/server";

/**
 * 브라우저가 2초 넘게 멈춘(long-animation-frame) 기록을 받아 Vercel Runtime Logs에만 남긴다.
 * DB·시트에는 아무것도 쓰지 않는다. 2026-10-27 대시보드 「메뉴 누르면 몇 분 멈춤」 원인 추적용.
 * 보내는 쪽: src/components/diag/long-frame-reporter.tsx
 */
export const runtime = "nodejs";

const MAX_BODY_CHARS = 20_000;

export async function POST(request: Request): Promise<NextResponse> {
  let text = "";
  try {
    text = (await request.text()).slice(0, MAX_BODY_CHARS);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // 한 줄 JSON으로 남겨 Logs 검색("[long-frame]")으로 바로 찾게 한다.
  console.warn(`[long-frame] ${text.replace(/\s+/g, " ")}`);

  return NextResponse.json({ ok: true });
}

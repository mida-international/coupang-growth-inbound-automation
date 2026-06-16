import { NextResponse } from "next/server";

import { logRouteError } from "@/lib/api/log-route-error";
import { prisma } from "@/lib/db";
import {
  saveShoplingWmsSession,
  type ShoplingWmsStorageState,
} from "@/lib/shopling-wms/session-store";
import { createAdminClient } from "@/lib/supabase/admin";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const MAX_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_TTL_MS = 60 * 60 * 1000;
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

function json(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

type StorageCookie = { expires?: number };

function deriveExpiry(storageState: ShoplingWmsStorageState): Date {
  const now = Date.now();
  const cookies = (storageState as { cookies?: StorageCookie[] }).cookies ?? [];
  let maxExp = 0;
  for (const c of cookies) {
    if (typeof c.expires === "number" && c.expires > 0) {
      maxExp = Math.max(maxExp, c.expires * 1000);
    }
  }
  if (maxExp <= now) {
    return new Date(now + DEFAULT_TTL_MS);
  }
  return new Date(Math.min(Math.max(maxExp, now + MIN_TTL_MS), now + MAX_TTL_MS));
}

function isValidStorageState(value: unknown): value is ShoplingWmsStorageState {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { cookies?: unknown }).cookies) &&
    (value as { cookies: unknown[] }).cookies.length > 0
  );
}

export function OPTIONS(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 확장 프로그램은 쿠키(SameSite) 대신 Supabase access token을 Bearer로 보낸다.
    const token = bearerToken(request);
    if (!token) {
      return json({ ok: false, error: "인증 토큰이 없습니다." }, 401);
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      return json({ ok: false, error: "유효하지 않은 토큰입니다." }, 401);
    }

    const profile = await prisma.profile.findUnique({
      where: { id: data.user.id },
      select: { id: true },
    });
    if (!profile) {
      return json({ ok: false, error: "프로필이 없습니다." }, 403);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "잘못된 요청 본문입니다." }, 400);
    }

    const storageState = (body as { storageState?: unknown }).storageState;
    if (!isValidStorageState(storageState)) {
      return json(
        { ok: false, error: "샵플링 세션(쿠키)이 비어 있습니다. 샵플링에 로그인했는지 확인해 주세요." },
        400,
      );
    }

    const expiresAt = deriveExpiry(storageState);
    await saveShoplingWmsSession(profile.id, storageState, expiresAt);

    return json({ ok: true, data: { expiresAt: expiresAt.toISOString() } }, 200);
  } catch (error) {
    logRouteError(error, {
      route: "/api/automation/shopling-negative-stock/session",
      method: "POST",
    });
    return json({ ok: false, error: "세션 저장에 실패했습니다." }, 500);
  }
}

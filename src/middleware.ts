import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasProfile } from "@/lib/auth/profile-edge";
import { getSupabaseEnv } from "@/lib/supabase/env";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
}

export async function middleware(request: NextRequest) {
  // 확장 프로그램의 세션 전송 라우트는 쿠키 세션이 없고 Bearer 토큰으로
  // 자체 인증하므로, 미들웨어의 쿠키 기반 인증 게이트를 건너뛴다.
  if (
    request.nextUrl.pathname ===
    "/api/automation/shopling-negative-stock/session"
  ) {
    return NextResponse.next();
  }

  const { url, anonKey } = getSupabaseEnv();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api/");

  if (!user && !isLoginPage) {
    if (isApiRoute) {
      const unauthorized = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      copyCookies(supabaseResponse, unauthorized);
      return unauthorized;
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const redirect = NextResponse.redirect(loginUrl);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (user) {
    const profileExists = await hasProfile(user.id);

    if (!profileExists) {
      if (isLoginPage) {
        return supabaseResponse;
      }

      if (isApiRoute) {
        const unauthorized = NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
        copyCookies(supabaseResponse, unauthorized);
        return unauthorized;
      }

      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      const redirect = NextResponse.redirect(loginUrl);
      copyCookies(supabaseResponse, redirect);
      return redirect;
    }

    if (isLoginPage) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      const redirect = NextResponse.redirect(homeUrl);
      copyCookies(supabaseResponse, redirect);
      return redirect;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export async function hasProfile(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    // 환경변수 누락은 운영에서 무한 로그인 루프를 유발하므로 반드시 노출한다.
    console.error(
      "[hasProfile] Supabase 환경변수 누락 — 인증된 사용자도 프로필 확인에 실패합니다.",
      {
        NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
        SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceRoleKey),
      }
    );
    return false;
  }

  const response = await fetch(
    `${url}/rest/v1/Profile?id=eq.${encodeURIComponent(userId)}&select=id`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      `[hasProfile] Profile 조회 실패 (status ${response.status})`,
      body
    );
    return false;
  }

  const data: unknown = await response.json();

  return Array.isArray(data) && data.length > 0;
}

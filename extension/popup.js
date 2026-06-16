const APP_URL = "https://coupang-growth-inbound-automation.vercel.app";
const SUPABASE_REF = "kjoqqxveosndyommgaqd";
const APP_HOST = "coupang-growth-inbound-automation.vercel.app";
const AUTH_COOKIE_BASE = `sb-${SUPABASE_REF}-auth-token`;

const statusEl = document.getElementById("status");
const btn = document.getElementById("send");

function setStatus(msg, kind) {
  statusEl.textContent = msg;
  statusEl.className = kind || "";
}

// chrome sameSite → Playwright sameSite
function mapSameSite(value) {
  switch (value) {
    case "no_restriction":
      return "None";
    case "strict":
      return "Strict";
    case "lax":
      return "Lax";
    default:
      return "Lax";
  }
}

// 샵플링 쿠키 → Playwright storageState 쿠키 배열
async function collectShoplingCookies() {
  const cookies = await chrome.cookies.getAll({ domain: "shopling.co.kr" });
  return cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path || "/",
    expires: typeof c.expirationDate === "number" ? c.expirationDate : -1,
    httpOnly: !!c.httpOnly,
    secure: !!c.secure,
    sameSite: mapSameSite(c.sameSite),
  }));
}

function base64UrlDecodeToString(b64url) {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

// 앱의 Supabase 인증 쿠키(청크 포함)에서 access_token 추출
async function getAppAccessToken() {
  const cookies = await chrome.cookies.getAll({ domain: APP_HOST });
  const auth = cookies.filter((c) => c.name.startsWith(AUTH_COOKIE_BASE));
  if (auth.length === 0) return null;

  // base, base.0, base.1 ... 순서로 정렬 후 값 이어붙이기
  auth.sort((a, b) => {
    const na = a.name === AUTH_COOKIE_BASE ? -1 : Number(a.name.split(".").pop());
    const nb = b.name === AUTH_COOKIE_BASE ? -1 : Number(b.name.split(".").pop());
    return na - nb;
  });
  let raw = auth.map((c) => c.value).join("");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* already decoded */
  }

  let jsonStr = raw;
  if (raw.startsWith("base64-")) {
    jsonStr = base64UrlDecodeToString(raw.slice("base64-".length));
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return null;
  }
  if (Array.isArray(parsed)) return parsed[0] || null;
  return parsed.access_token || null;
}

async function run() {
  btn.disabled = true;
  setStatus("세션 수집 중...");
  try {
    const token = await getAppAccessToken();
    if (!token) {
      setStatus(
        "입고 자동화 앱 로그인 정보를 찾지 못했습니다. 먼저 앱에 로그인해 주세요.",
        "err",
      );
      btn.disabled = false;
      return;
    }

    const cookies = await collectShoplingCookies();
    if (cookies.length === 0) {
      setStatus(
        "샵플링 쿠키가 없습니다. 샵플링 WMS에 로그인했는지 확인해 주세요.",
        "err",
      );
      btn.disabled = false;
      return;
    }

    setStatus("앱으로 전송 중...");
    const res = await fetch(
      `${APP_URL}/api/automation/shopling-negative-stock/session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storageState: { cookies, origins: [] } }),
      },
    );

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      const exp = data.data?.expiresAt
        ? new Date(data.data.expiresAt).toLocaleString("ko-KR")
        : "";
      setStatus(`✅ 세션 전송 완료. 만료: ${exp}`, "ok");
    } else {
      setStatus(`❌ 실패 (${res.status}): ${data.error || "알 수 없는 오류"}`, "err");
    }
  } catch (e) {
    setStatus(`❌ 오류: ${e.message}`, "err");
  } finally {
    btn.disabled = false;
  }
}

btn.addEventListener("click", run);

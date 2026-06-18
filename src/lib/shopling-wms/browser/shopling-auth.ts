/** 샵플링 WMS 로그인 폼 앵커 (URL이 login.phtml이 아니어도 iframe/본문에 표시될 수 있음) */
export const SHOPLING_LOGIN_ANCHOR_SELECTORS = [
  "#login_id",
  'input[name="login_id"]',
  "#login_pw",
  'input[name="login_pw"]',
] as const;

export const SHOPLING_SESSION_EXPIRED_MESSAGE =
  "샵플링 WMS 세션이 만료되었습니다. 샵플링에 로그인한 뒤 크롬 플러그인으로 세션을 다시 전송해 주세요.";

export const SHOPLING_LOGIN_REQUIRED_MESSAGE =
  "샵플링 WMS 로그인이 필요합니다. 자동화 실행 전 로그인을 완료해 주세요.";

export function isShoplingWmsLoginUrl(url: string | URL): boolean {
  const href = typeof url === "string" ? url : url.href;
  return href.includes("login.phtml");
}

/** HTML 문자열에 로그인 폼 앵커가 있는지 확인 (단위 테스트용) */
export function htmlContainsShoplingLoginForm(html: string): boolean {
  return SHOPLING_LOGIN_ANCHOR_SELECTORS.some((selector) => {
    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      return (
        html.includes(`id="${id}"`) ||
        html.includes(`id='${id}'`)
      );
    }

    if (selector.startsWith('input[name="')) {
      const name = selector.slice('input[name="'.length, -2);
      return (
        html.includes(`name="${name}"`) ||
        html.includes(`name='${name}'`)
      );
    }

    return false;
  });
}

/** HTML 문자열에 CSS 셀렉터 중 하나라도 매칭되는지 확인 (단위 테스트용) */
export function htmlMatchesAnySelector(
  html: string,
  selectors: readonly string[],
): boolean {
  for (const selector of selectors) {
    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      if (html.includes(`id="${id}"`) || html.includes(`id='${id}'`)) {
        return true;
      }
      continue;
    }

    const nameMatch = selector.match(/^input\[name="([^"]+)"\]$/);
    if (nameMatch) {
      const name = nameMatch[1];
      if (html.includes(`name="${name}"`) || html.includes(`name='${name}'`)) {
        return true;
      }
      continue;
    }

    const valueMatch = selector.match(/^input\[value="([^"]+)"\]$/);
    if (valueMatch) {
      const value = valueMatch[1];
      if (html.includes(`value="${value}"`) || html.includes(`value='${value}'`)) {
        return true;
      }
      continue;
    }

    const onclickMatch = selector.match(/^input\[onclick="([^"]+)"\]$/);
    if (onclickMatch) {
      const onclick = onclickMatch[1];
      if (
        html.includes(`onclick="${onclick}"`) ||
        html.includes(`onclick='${onclick}'`)
      ) {
        return true;
      }
      continue;
    }

    const typeValueMatch = selector.match(
      /^input\[type="([^"]+)"\]\[value="([^"]+)"\]$/,
    );
    if (typeValueMatch) {
      const [, type, value] = typeValueMatch;
      if (
        html.includes(`type="${type}"`) &&
        (html.includes(`value="${value}"`) || html.includes(`value='${value}'`))
      ) {
        return true;
      }
    }
  }

  return false;
}

export function isShoplingSessionExpiredError(message: string): boolean {
  return (
    message.includes("샵플링 WMS 세션이 만료되었습니다") ||
    message.includes("샵플링 WMS 로그인이 필요합니다")
  );
}

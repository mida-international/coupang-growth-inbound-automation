import "server-only";

import { getKstTodayDate } from "@/lib/date/kst-today";
import { buildShoplingRequestXml } from "@/lib/shopling/build-request-xml";
import { SHOPLING_PROD_GATHER_URL } from "@/lib/shopling/constants";
import {
  formatYyyyMmDd,
  subtractDaysFromKstDate,
} from "@/lib/shopling/format-yyyymmdd";
import { postShoplingApi } from "@/lib/shopling/post-shopling-api";
import {
  countProductsInResponseXml,
  extractShoplingApiError,
} from "@/lib/shopling/parse-response-xml";
import { getShoplingApiConfigSecret } from "@/services/shopling-api-config/get-shopling-api-config-secret";
import type {
  ShoplingApiConfigResult,
  ShoplingApiConnectionTestResult,
} from "@/services/shopling-api-config/types";

const TEST_LOOKBACK_DAYS = 7;

function formatFetchError(error: unknown): string {
  if (error instanceof Error) {
    const cause =
      error.cause instanceof Error
        ? error.cause.message
        : error.cause
          ? String(error.cause)
          : null;

    if (cause) {
      return `${error.message} (${cause})`;
    }

    return error.message;
  }

  return String(error);
}

export async function testShoplingApiConnection(): Promise<
  ShoplingApiConfigResult<ShoplingApiConnectionTestResult>
> {
  const configResult = await getShoplingApiConfigSecret();

  if (!configResult.ok) {
    return configResult;
  }

  const endDate = getKstTodayDate();
  const startDate = subtractDaysFromKstDate(endDate, TEST_LOOKBACK_DAYS);
  const startDt = formatYyyyMmDd(startDate);
  const endDt = formatYyyyMmDd(endDate);

  const requestXml = buildShoplingRequestXml({
    loginId: configResult.data.loginId,
    companyId: configResult.data.companyId,
    apiAuthKey: configResult.data.apiAuthKey,
    startDt,
    endDt,
  });

  const startedAt = performance.now();
  let httpStatus: number;
  let responseText: string;

  try {
    const response = await postShoplingApi(
      SHOPLING_PROD_GATHER_URL,
      requestXml,
    );
    httpStatus = response.status;
    responseText = response.body;
  } catch (error) {
    return {
      ok: true,
      data: {
        ok: false,
        message: "샵플링 API 서버에 연결할 수 없습니다.",
        httpStatus: null,
        durationMs: Math.round(performance.now() - startedAt),
        startDt,
        endDt,
        productCount: 0,
        apiError: formatFetchError(error),
      },
    };
  }

  const durationMs = Math.round(performance.now() - startedAt);
  const productCount = countProductsInResponseXml(responseText);
  const apiError = extractShoplingApiError(responseText);
  const responseOk = httpStatus >= 200 && httpStatus < 300;

  if (!responseOk) {
    return {
      ok: true,
      data: {
        ok: false,
        message: `샵플링 API 요청에 실패했습니다. (HTTP ${httpStatus})`,
        httpStatus,
        durationMs,
        startDt,
        endDt,
        productCount,
        apiError: apiError ?? (responseText.slice(0, 300) || null),
      },
    };
  }

  if (apiError) {
    return {
      ok: true,
      data: {
        ok: false,
        message: `연동 실패: ${apiError}`,
        httpStatus,
        durationMs,
        startDt,
        endDt,
        productCount,
        apiError,
      },
    };
  }

  return {
    ok: true,
    data: {
      ok: true,
      message:
        productCount > 0
          ? `연동 성공 — 최근 ${TEST_LOOKBACK_DAYS}일 상품 ${productCount}건 조회됨`
          : `연동 성공 — 최근 ${TEST_LOOKBACK_DAYS}일 조회 결과 0건 (인증·통신 정상)`,
      httpStatus,
      durationMs,
      startDt,
      endDt,
      productCount,
      apiError: null,
    },
  };
}

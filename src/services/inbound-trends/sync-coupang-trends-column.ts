import { pushTrendsDateColumnToSheet } from "@/services/inbound-trends/push-trends-date-column-to-sheet";

/** 추세 시트 자동 반영 대상 계정 (창고전송용 입고리스트 자동 반영과 동일) */
const TRENDS_AUTO_PUSH_ACCOUNT = "mizucos";

export type CoupangTrendsColumnSyncResult = {
  status: "success" | "error";
  message: string;
  sheetUrl: string | null;
};

export function isTrendsAutoPushAccount(displayName: string): boolean {
  return displayName.trim().toLowerCase() === TRENDS_AUTO_PUSH_ACCOUNT;
}

/** Date → KST 기준 YYYY-MM-DD */
export function toKstIsoDate(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/** 쿠팡 입고 열 제목: 'M/D(완)' — 추세관리의 (완) 버튼과 같은 제목 */
export function buildCoupangTrendsColumnTitle(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${Number(month)}/${Number(day)}(완)`;
}

/**
 * 그날 쿠팡 입고 기록 합계로 추세 시트의 'M/D(완)' 열을 다시 반영한다.
 * 기록·원복 직후에 호출한다. 그날 열이 있으면 값만 그날 합계로 갱신하고, 없으면 새로 넣는다.
 * 그날 기록이 모두 원복되었으면 열 값을 비운다. 실패해도 예외를 던지지 않는다.
 */
export async function syncCoupangTrendsColumn(input: {
  coupangSellerAccountId: string;
  isoDate: string;
  /** 그날 열이 없을 때 새로 넣을지. 기록=true, 원복=false (지난 날짜 열을 새로 만들지 않음) */
  insertIfMissing: boolean;
}): Promise<CoupangTrendsColumnSyncResult> {
  const title = buildCoupangTrendsColumnTitle(input.isoDate);

  try {
    const result = await pushTrendsDateColumnToSheet({
      coupangSellerAccountId: input.coupangSellerAccountId,
      date: input.isoDate,
      kind: "coupang",
      title,
      clearWhenEmpty: true,
      insertIfMissing: input.insertIfMissing,
    });

    if (!result.ok) {
      return {
        status: "error",
        message: `추세 시트 '${title}' 열 반영에 실패했습니다: ${result.error}`,
        sheetUrl: null,
      };
    }

    if (result.data.outcome === "cleared") {
      return {
        status: "success",
        message: `그날 기록이 없어 추세 시트 '${title}' 열 값을 비웠습니다.`,
        sheetUrl: result.data.sheetUrl,
      };
    }

    if (result.data.outcome === "not-found") {
      return {
        status: "error",
        message: `추세 시트에서 '${title}' 열을 찾지 못해 시트는 그대로 두었습니다. 필요하면 추세관리에서 직접 반영해 주세요.`,
        sheetUrl: result.data.sheetUrl,
      };
    }

    return {
      status: "success",
      message: `추세 시트 '${title}' 열 반영 — 시트 바코드 ${result.data.barcodeRowCount}개 중 ${result.data.matchedCount}개 매칭 (기록 바코드 ${result.data.valueCount}개)`,
      sheetUrl: result.data.sheetUrl,
    };
  } catch (error) {
    return {
      status: "error",
      message: `추세 시트 '${title}' 열 반영에 실패했습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
      sheetUrl: null,
    };
  }
}

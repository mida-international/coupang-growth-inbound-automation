import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  getGoogleSheetsConfig,
  getTrendsSheetTarget,
} from "@/lib/google-sheets/client";
import {
  formatGoogleSheetsPermissionError,
  getGoogleApiErrorMessage,
  getGoogleApiErrorStatus,
} from "@/lib/google-sheets/google-api-error";
import {
  clearTrendsDateColumn,
  insertTrendsDateColumn,
  MAX_SYNC_DAYS_AGO,
  titleSearchColumnCount,
} from "@/lib/google-sheets/insert-trends-date-column";

/**
 * 추세 시트 반영을 한 번에 하나씩만 실행하기 위한 DB advisory lock 키.
 * 두 사람이 동시에 기록해도 열이 두 번 삽입되거나 옛 합계가 나중에 덮어쓰지 않게 한다.
 */
const TRENDS_SHEET_LOCK_KEY = 7202609291;

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD 날짜가 KST 오늘로부터 며칠 전인지 */
function daysAgoFromKstToday(isoDate: string): number {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  return Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${isoDate}T00:00:00Z`)) / DAY_MS,
  );
}

export type TrendsDateColumnKind = "coupang" | "warehouse";

export type PushTrendsDateColumnInput = {
  coupangSellerAccountId: string;
  /** YYYY-MM-DD */
  date: string;
  kind: TrendsDateColumnKind;
  /** P열 헤더 제목 (예: "6/22", "6/22(완)") */
  title: string;
  /** 그날 데이터가 없으면 오류 대신 같은 제목의 기존 열 값을 비운다 (기록 원복 후 동기화용) */
  clearWhenEmpty?: boolean;
  /** 기존 열이 없을 때 새로 넣을지 (기본 true). 원복 동기화는 false — 지난 날짜 열을 P열에 새로 만들지 않는다 */
  insertIfMissing?: boolean;
};

/** 시트에 한 일: 새 열 삽입 / 기존 열 값 갱신 / 기존 열 값 비움 / 열을 못 찾아 그대로 둠 */
export type TrendsColumnOutcome = "created" | "updated" | "cleared" | "not-found";

export type PushTrendsDateColumnResult =
  | {
      ok: true;
      data: {
        sheetUrl: string;
        sheetTitle: string;
        barcodeRowCount: number;
        matchedCount: number;
        valueCount: number;
        outcome: TrendsColumnOutcome;
      };
    }
  | {
      ok: false;
      error: string;
      status: 400 | 403 | 404 | 503 | 500;
    };

type DailyRow = {
  product_barcode: string | null;
  quantity: number | bigint | null;
};

async function fetchBarcodeQuantities(
  sellerId: string,
  date: string,
  kind: TrendsDateColumnKind,
): Promise<Map<string, number>> {
  const recordDate = new Date(`${date}T00:00:00.000Z`);

  const rows =
    kind === "coupang"
      ? await prisma.$queryRaw<DailyRow[]>(
          Prisma.sql`
            SELECT product_barcode, quantity
            FROM coupang_inbound_daily_v
            WHERE coupang_seller_account_id = ${sellerId}
              AND record_date = ${recordDate}::date
          `,
        )
      : await prisma.$queryRaw<DailyRow[]>(
          Prisma.sql`
            SELECT product_barcode, quantity
            FROM warehouse_inbound_daily_v
            WHERE coupang_seller_account_id = ${sellerId}
              AND record_date = ${recordDate}::date
          `,
        );

  const map = new Map<string, number>();

  for (const row of rows) {
    if (!row.product_barcode) {
      continue;
    }

    const key = String(row.product_barcode).trim().replace(/\s/g, "");

    if (!key) {
      continue;
    }

    const qty = Number(row.quantity ?? 0);

    if (!Number.isFinite(qty)) {
      continue;
    }

    map.set(key, (map.get(key) ?? 0) + qty);
  }

  return map;
}

function mapGoogleSheetsError(
  error: unknown,
  clientEmail: string | null,
): PushTrendsDateColumnResult {
  const message = getGoogleApiErrorMessage(error);
  const status = getGoogleApiErrorStatus(error);

  if (status === 403 || /permission|insufficient/i.test(message)) {
    return {
      ok: false,
      error: formatGoogleSheetsPermissionError(clientEmail),
      status: 403,
    };
  }

  if (status === 404 || /not found|unable to parse range/i.test(message)) {
    return {
      ok: false,
      error:
        "추세 시트를 찾을 수 없습니다. GOOGLE_TRENDS_SHEET_ID / GOOGLE_TRENDS_SHEET_GID를 확인해 주세요.",
      status: 404,
    };
  }

  return {
    ok: false,
    error: message,
    status: 500,
  };
}

export async function pushTrendsDateColumnToSheet(
  input: PushTrendsDateColumnInput,
): Promise<PushTrendsDateColumnResult> {
  const sheetsConfig = getGoogleSheetsConfig();

  if (!sheetsConfig.ok) {
    return { ok: false, error: sheetsConfig.error, status: 503 };
  }

  const target = getTrendsSheetTarget();

  if (!target) {
    return {
      ok: false,
      error:
        "추세 시트가 설정되지 않았습니다. GOOGLE_TRENDS_SHEET_ID(스프레드시트 ID)를 설정해 주세요.",
      status: 503,
    };
  }

  const daysAgo = daysAgoFromKstToday(input.date);

  if (daysAgo > MAX_SYNC_DAYS_AGO) {
    return {
      ok: false,
      error: `${MAX_SYNC_DAYS_AGO}일보다 지난 날짜는 시트에 자동 반영하지 않습니다 (작년 같은 날짜 열과 헷갈릴 수 있음). 시트에서 직접 확인해 주세요.`,
      status: 400,
    };
  }

  const searchColumnCount = titleSearchColumnCount(daysAgo);

  try {
    // 합계 조회부터 시트 쓰기까지 잠금 안에서 실행한다 (동시 반영 시 열 중복·옛 합계 덮어쓰기 방지).
    return await prisma.$transaction(
      async (tx): Promise<PushTrendsDateColumnResult> => {
        await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(${Prisma.raw(String(TRENDS_SHEET_LOCK_KEY))})) AS l`;

        const barcodeToValue = await fetchBarcodeQuantities(
          input.coupangSellerAccountId,
          input.date,
          input.kind,
        );

        if (barcodeToValue.size === 0 && input.clearWhenEmpty) {
          const cleared = await clearTrendsDateColumn(sheetsConfig.config, {
            spreadsheetId: target.spreadsheetId,
            sheetGid: target.sheetGid,
            title: input.title,
            searchColumnCount,
          });

          return {
            ok: true,
            data: {
              sheetUrl: cleared.sheetUrl,
              sheetTitle: input.title,
              barcodeRowCount: 0,
              matchedCount: 0,
              valueCount: 0,
              outcome: cleared.cleared ? "cleared" : "not-found",
            },
          };
        }

        if (barcodeToValue.size === 0) {
          const label = input.kind === "coupang" ? "쿠팡 입고(완)" : "창고 입고";
          return {
            ok: false,
            error: `${input.date}에 ${label} 데이터가 없습니다.`,
            status: 400,
          };
        }

        const result = await insertTrendsDateColumn(sheetsConfig.config, {
          spreadsheetId: target.spreadsheetId,
          sheetGid: target.sheetGid,
          title: input.title,
          barcodeToValue,
          searchColumnCount,
          insertIfMissing: input.insertIfMissing,
        });

        return {
          ok: true,
          data: {
            sheetUrl: result.sheetUrl,
            sheetTitle: result.sheetTitle,
            barcodeRowCount: result.barcodeRowCount,
            matchedCount: result.matchedCount,
            valueCount: barcodeToValue.size,
            outcome: result.skipped
              ? "not-found"
              : result.created
                ? "created"
                : "updated",
          },
        };
      },
      // Google Sheets API 호출이 끝날 때까지 잠금을 유지한다.
      { maxWait: 30_000, timeout: 55_000 },
    );
  } catch (error) {
    return mapGoogleSheetsError(error, sheetsConfig.config.clientEmail);
  }
}

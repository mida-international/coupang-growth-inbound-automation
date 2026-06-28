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
import { insertTrendsDateColumn } from "@/lib/google-sheets/insert-trends-date-column";

export type TrendsDateColumnKind = "coupang" | "warehouse";

export type PushTrendsDateColumnInput = {
  coupangSellerAccountId: string;
  /** YYYY-MM-DD */
  date: string;
  kind: TrendsDateColumnKind;
  /** P열 헤더 제목 (예: "6/22", "6/22(완)") */
  title: string;
};

export type PushTrendsDateColumnResult =
  | {
      ok: true;
      data: {
        sheetUrl: string;
        sheetTitle: string;
        barcodeRowCount: number;
        matchedCount: number;
        valueCount: number;
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

  try {
    const barcodeToValue = await fetchBarcodeQuantities(
      input.coupangSellerAccountId,
      input.date,
      input.kind,
    );

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
    });

    return {
      ok: true,
      data: {
        sheetUrl: result.sheetUrl,
        sheetTitle: result.sheetTitle,
        barcodeRowCount: result.barcodeRowCount,
        matchedCount: result.matchedCount,
        valueCount: barcodeToValue.size,
      },
    };
  } catch (error) {
    return mapGoogleSheetsError(error, sheetsConfig.config.clientEmail);
  }
}

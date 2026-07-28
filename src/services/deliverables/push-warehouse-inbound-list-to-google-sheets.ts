import { getKstTodayDate } from "@/lib/date/kst-today";
import { getGoogleSheetsConfig } from "@/lib/google-sheets/client";
import {
  formatGoogleSheetsPermissionError,
  getGoogleApiErrorMessage,
  getGoogleApiErrorStatus,
} from "@/lib/google-sheets/google-api-error";
import { writeGridToGoogleSheet } from "@/lib/google-sheets/write-grid-to-sheet";
import { generateWarehouseInboundListContext } from "@/services/deliverables/generate-warehouse-inbound-list-context";

export type PushWarehouseInboundListToGoogleSheetsInput = {
  coupangSellerAccountId: string;
  rotation: 0 | 1 | 2 | 3;
};

// 탭 이름: YYMMDD_계정이름_창고 전송용 입고리스트.
// 계정별 탭 하나를 유지하며, 날짜가 바뀌면 새 탭을 만들지 않고 리네임 + 내용 갱신한다.
const WAREHOUSE_INBOUND_SHEET_SUFFIX = "창고 전송용 입고리스트";
const LEGACY_SHEET_TITLE = "창고전송용 입고리스트";

function formatKstYymmdd(date: Date): string {
  const year = String(date.getUTCFullYear() % 100).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

export type PushWarehouseInboundListToGoogleSheetsResult =
  | {
      ok: true;
      data: {
        sheetUrl: string;
        sheetTitle: string;
        rowCount: number;
      };
    }
  | {
      ok: false;
      error: string;
      status: 400 | 403 | 404 | 503 | 500;
    };

function mapGoogleSheetsError(
  error: unknown,
  clientEmail: string | null,
): PushWarehouseInboundListToGoogleSheetsResult {
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
        "스프레드시트를 찾을 수 없습니다. GOOGLE_SHEET_ID가 올바른지 확인해 주세요.",
      status: 404,
    };
  }

  if (message.includes("판매자")) {
    return {
      ok: false,
      error: message,
      status: 400,
    };
  }

  return {
    ok: false,
    error: message,
    status: 500,
  };
}

export async function pushWarehouseInboundListToGoogleSheets(
  input: PushWarehouseInboundListToGoogleSheetsInput,
): Promise<PushWarehouseInboundListToGoogleSheetsResult> {
  const sheetsConfig = getGoogleSheetsConfig();

  if (!sheetsConfig.ok) {
    return {
      ok: false,
      error: sheetsConfig.error,
      status: 503,
    };
  }

  try {
    const context = await generateWarehouseInboundListContext(
      input.coupangSellerAccountId,
      input.rotation,
    );

    const accountName = context.seller.displayName.trim();
    const titleSuffix = `_${accountName}_${WAREHOUSE_INBOUND_SHEET_SUFFIX}`;
    const sheetTitle = `${formatKstYymmdd(getKstTodayDate())}${titleSuffix}`;

    const writeResult = await writeGridToGoogleSheet(sheetsConfig.config, {
      spreadsheetId: sheetsConfig.config.spreadsheetId,
      sheetTitle,
      headers: context.grid.headers,
      rows: context.grid.rows,
      // 같은 계정의 이전 날짜 탭(또는 구버전 고정 탭)을 리네임해 재사용
      reuseSheetMatcher: (title) =>
        title.endsWith(titleSuffix) || title === LEGACY_SHEET_TITLE,
    });

    return {
      ok: true,
      data: {
        sheetUrl: writeResult.sheetUrl,
        sheetTitle: writeResult.sheetTitle,
        rowCount: context.grid.rows.length,
      },
    };
  } catch (error) {
    return mapGoogleSheetsError(error, sheetsConfig.config.clientEmail);
  }
}

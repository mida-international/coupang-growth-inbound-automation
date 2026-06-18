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

    const writeResult = await writeGridToGoogleSheet(sheetsConfig.config, {
      spreadsheetId: sheetsConfig.config.spreadsheetId,
      sheetTitle: context.grid.sheetTitle,
      headers: context.grid.headers,
      rows: context.grid.rows,
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

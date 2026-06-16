import "server-only";

import type { ApiResult } from "@/lib/api/types";
import { runNegativeStock as runNegativeStockLib } from "@/lib/shopling-wms/negative-stock/run-negative-stock";
import {
  isShoplingWmsAutomationAvailable,
  SHOPLING_WMS_AUTOMATION_UNAVAILABLE_MESSAGE,
} from "@/lib/shopling-wms/runtime";

export type NegativeStockRunData = {
  rowCount: number;
  memo: string;
  filledFilePath: string;
  message?: string;
};

export type NegativeStockRunServiceResult = ApiResult<NegativeStockRunData>;

export async function runNegativeStock(
  userId: string,
): Promise<NegativeStockRunServiceResult> {
  if (!isShoplingWmsAutomationAvailable()) {
    return { ok: false, error: SHOPLING_WMS_AUTOMATION_UNAVAILABLE_MESSAGE };
  }

  try {
    const result = await runNegativeStockLib(userId);

    if (!result.ok) {
      return { ok: false, error: result.message };
    }

    return {
      ok: true,
      data: {
        rowCount: result.rowCount,
        memo: result.memo,
        filledFilePath: result.filledFilePath,
        message: result.message,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "음수 재고 빼기에 실패했습니다.";

    return { ok: false, error: message };
  }
}

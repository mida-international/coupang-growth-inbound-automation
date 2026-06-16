import "server-only";

import type { ApiResult } from "@/lib/api/types";
import {
  runNegativeStock as runNegativeStockLib,
  type RunNegativeStockOptions,
} from "@/lib/shopling-wms/negative-stock/run-negative-stock";
import {
  isShoplingWmsRunAvailable,
  SHOPLING_WMS_AUTOMATION_UNAVAILABLE_MESSAGE,
} from "@/lib/shopling-wms/runtime";

export type NegativeStockRunData = {
  rowCount: number;
  memo: string;
  filledFilePath: string;
  runDir: string;
  message?: string;
};

export type NegativeStockRunServiceResult = ApiResult<NegativeStockRunData>;

export async function runNegativeStock(
  userId: string,
  options: RunNegativeStockOptions = {},
): Promise<NegativeStockRunServiceResult> {
  if (!isShoplingWmsRunAvailable()) {
    return { ok: false, error: SHOPLING_WMS_AUTOMATION_UNAVAILABLE_MESSAGE };
  }

  try {
    const result = await runNegativeStockLib(userId, options);

    if (!result.ok) {
      return { ok: false, error: result.message };
    }

    return {
      ok: true,
      data: {
        rowCount: result.rowCount,
        memo: result.memo,
        filledFilePath: result.filledFilePath,
        runDir: result.runDir,
        message: result.message,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "음수 재고 빼기에 실패했습니다.";

    return { ok: false, error: message };
  }
}

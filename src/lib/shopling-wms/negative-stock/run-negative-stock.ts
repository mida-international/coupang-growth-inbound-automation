import {
  closeShoplingWmsBrowser,
  launchShoplingWmsBrowser,
} from "@/lib/shopling-wms/browser/context";
import { fillStockImportTemplate } from "@/lib/shopling-wms/excel/fill-stock-import-template";
import { parseNegativeInventoryFile } from "@/lib/shopling-wms/excel/parse-negative-inventory-file";
import {
  buildNegativeStockMemo,
  formatKstTimestamp,
} from "@/lib/shopling-wms/format-kst-timestamp";
import { downloadNegativeInventoryExcel } from "@/lib/shopling-wms/negative-stock/phase1-download-inventory";
import { uploadStockImportAndApply } from "@/lib/shopling-wms/negative-stock/phase3-upload-and-apply";

export type NegativeStockRunResult =
  | {
      ok: true;
      rowCount: number;
      memo: string;
      filledFilePath: string;
      runDir: string;
      message?: string;
    }
  | {
      ok: false;
      message: string;
      phase?: "session" | "phase1" | "phase2" | "phase3";
    };

export async function runNegativeStock(
  userId: string,
): Promise<NegativeStockRunResult> {
  const browserSession = await launchShoplingWmsBrowser(userId);

  if (!browserSession) {
    return {
      ok: false,
      message: "로그인 세션이 없습니다. 먼저 로그인을 실행해 주세요.",
      phase: "session",
    };
  }

  const timestamp = formatKstTimestamp();
  const memo = buildNegativeStockMemo(timestamp);

  try {
    let inventoryBuffer: Buffer;

    try {
      inventoryBuffer = await downloadNegativeInventoryExcel(
        browserSession.page,
        browserSession.downloadDir,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "음수 재고 엑셀 다운로드에 실패했습니다.";

      return { ok: false, message, phase: "phase1" };
    }

    let filledFilePath: string;
    let rowCount = 0;

    try {
      const parsed = parseNegativeInventoryFile(inventoryBuffer);

      if (parsed.empty) {
        await closeShoplingWmsBrowser(browserSession);

        return {
          ok: true,
          rowCount: 0,
          memo,
          filledFilePath: "",
          runDir: browserSession.runDir,
          message: "음수 재고 0건",
        };
      }

      rowCount = parsed.rows.length;

      const filled = await fillStockImportTemplate(
        parsed.rows,
        browserSession.outputDir,
        timestamp,
      );

      filledFilePath = filled.filePath;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "입고등록 엑셀 가공에 실패했습니다.";

      return { ok: false, message, phase: "phase2" };
    }

    try {
      await uploadStockImportAndApply(
        browserSession.page,
        filledFilePath,
        memo,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "엑셀 대량등록 또는 재고반영에 실패했습니다.";

      return { ok: false, message, phase: "phase3" };
    }

    await closeShoplingWmsBrowser(browserSession);

    return {
      ok: true,
      rowCount,
      memo,
      filledFilePath,
      runDir: browserSession.runDir,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "음수 재고 빼기에 실패했습니다.";

    return { ok: false, message };
  }
}

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
      cancelled?: boolean;
    };

export type RunNegativeStockOptions = {
  /** 진행 단계 메시지 콜백 (스트리밍 표시용) */
  onProgress?: (message: string) => void;
  /** 중지 신호. abort 시 브라우저를 닫고 중단한다. */
  signal?: AbortSignal;
};

const CANCELLED_MESSAGE = "사용자가 작업을 중지했습니다.";

export async function runNegativeStock(
  userId: string,
  options: RunNegativeStockOptions = {},
): Promise<NegativeStockRunResult> {
  const { onProgress, signal } = options;
  const progress = (message: string) => onProgress?.(message);

  if (signal?.aborted) {
    return { ok: false, message: CANCELLED_MESSAGE, cancelled: true };
  }

  progress("로그인 세션 확인 및 브라우저 시작 중...");
  const browserSession = await launchShoplingWmsBrowser(userId);

  if (!browserSession) {
    return {
      ok: false,
      message: "로그인 세션이 없습니다. 먼저 로그인을 실행해 주세요.",
      phase: "session",
    };
  }

  // 중지 신호가 오면 브라우저를 즉시 닫아 진행 중인 작업을 중단시킨다.
  const onAbort = () => {
    void browserSession.browser.close().catch(() => undefined);
  };
  signal?.addEventListener("abort", onAbort);

  const timestamp = formatKstTimestamp();
  const memo = buildNegativeStockMemo(timestamp);

  try {
    let inventoryBuffer: Buffer;

    try {
      progress("샵플링 WMS 접속 · 음수 재고 조회 및 엑셀 다운로드 중...");
      inventoryBuffer = await downloadNegativeInventoryExcel(
        browserSession.page,
        browserSession.runId,
      );
    } catch (error) {
      if (signal?.aborted) {
        return { ok: false, message: CANCELLED_MESSAGE, cancelled: true };
      }
      const message =
        error instanceof Error
          ? error.message
          : "음수 재고 엑셀 다운로드에 실패했습니다.";

      return { ok: false, message, phase: "phase1" };
    }

    let filledFilePath: string;
    let rowCount = 0;

    try {
      progress("음수 재고 분석 중...");
      const parsed = parseNegativeInventoryFile(inventoryBuffer);

      if (parsed.empty) {
        await closeShoplingWmsBrowser(browserSession);
        progress("음수 재고 0건 — 처리할 항목이 없습니다.");

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
      progress(`입고등록 파일 생성 중... (음수 재고 ${rowCount}건)`);

      const filled = await fillStockImportTemplate(
        parsed.rows,
        browserSession.runId,
        timestamp,
      );

      filledFilePath = filled.filePath;
    } catch (error) {
      if (signal?.aborted) {
        return { ok: false, message: CANCELLED_MESSAGE, cancelled: true };
      }
      const message =
        error instanceof Error
          ? error.message
          : "입고등록 엑셀 가공에 실패했습니다.";

      return { ok: false, message, phase: "phase2" };
    }

    try {
      progress("입고등록 업로드 및 재고 반영 중...");
      await uploadStockImportAndApply(
        browserSession.page,
        filledFilePath,
        memo,
      );
    } catch (error) {
      if (signal?.aborted) {
        return { ok: false, message: CANCELLED_MESSAGE, cancelled: true };
      }
      const message =
        error instanceof Error
          ? error.message
          : "엑셀 대량등록 또는 재고반영에 실패했습니다.";

      return { ok: false, message, phase: "phase3" };
    }

    await closeShoplingWmsBrowser(browserSession);
    progress(`완료 — 음수 재고 ${rowCount}건 반영`);

    return {
      ok: true,
      rowCount,
      memo,
      filledFilePath,
      runDir: browserSession.runDir,
    };
  } catch (error) {
    if (signal?.aborted) {
      return { ok: false, message: CANCELLED_MESSAGE, cancelled: true };
    }
    const message =
      error instanceof Error ? error.message : "음수 재고 빼기에 실패했습니다.";

    return { ok: false, message };
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}

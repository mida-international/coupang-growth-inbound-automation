import { requireApiProfile } from "@/lib/api/auth";
import { buildExcelDownloadResponse } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildSellerAccountsFilename,
  generateSellerAccountsBuffer,
} from "@/lib/excel/generators/seller-accounts-export";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";

export async function GET() {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const accounts = await listSellerAccounts();

    if (accounts.length === 0) {
      return jsonError("다운로드할 판매자 계정 데이터가 없습니다.", 400);
    }

    const buffer = generateSellerAccountsBuffer(accounts);

    return buildExcelDownloadResponse(buffer, buildSellerAccountsFilename());
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/seller-accounts",
      method: "GET",
    });

    const message =
      error instanceof Error
        ? error.message
        : "판매자 계정 엑셀 다운로드에 실패했습니다.";

    return jsonError(message, 500);
  }
}

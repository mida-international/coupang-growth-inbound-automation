import { requireApiProfile } from "@/lib/api/auth";
import {
  buildExcelDownloadResponse,
  parseSellerIdsFromSearchParams,
} from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildInboundWorkbenchFilename,
  generateInboundWorkbenchBuffer,
} from "@/lib/excel/generators/inbound-workbench-export";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";
import { resolveSellerAccountIds } from "@/services/coupang-seller-accounts/get-default-seller-account-id";
import { listInboundWorkbench } from "@/services/inbound-workbench/list-inbound-workbench";

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const searchParams = new URL(request.url).searchParams;
    const accounts = await listSellerAccounts();
    const sellerIds = resolveSellerAccountIds(
      accounts,
      parseSellerIdsFromSearchParams(searchParams),
    );

    if (sellerIds.length === 0) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    const data = await listInboundWorkbench({
      coupangSellerAccountIds: sellerIds,
      search: searchParams.get("q") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      dir: searchParams.get("dir") ?? undefined,
      exportAll: true,
    });

    if (data.totalCount === 0) {
      return jsonError("다운로드할 대시보드 데이터가 없습니다.", 400);
    }

    const buffer = generateInboundWorkbenchBuffer(data.rows, {
      includeSellerColumn: sellerIds.length > 1,
    });

    return buildExcelDownloadResponse(buffer, buildInboundWorkbenchFilename());
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/inbound-workbench",
      method: "GET",
    });

    const message =
      error instanceof Error
        ? error.message
        : "대시보드 엑셀 다운로드에 실패했습니다.";

    return jsonError(message, 500);
  }
}

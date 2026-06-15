import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildWarehouseInboundListFilename,
  generateWarehouseInboundListBuffer,
} from "@/lib/excel/generators/warehouse-inbound-list";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";
import { listWarehouseInboundRows } from "@/services/deliverables/list-warehouse-inbound-rows";

function encodeContentDispositionFilename(filename: string): string {
  const encoded = encodeURIComponent(filename);

  return `attachment; filename*=UTF-8''${encoded}`;
}

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const sellerId = new URL(request.url).searchParams.get("seller")?.trim();

    if (!sellerId) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    const accounts = await listSellerAccounts();
    const seller = accounts.find(
      (account) => account.id === sellerId && account.isActive,
    );

    if (!seller) {
      return jsonError("유효한 판매자 계정이 아닙니다.", 400);
    }

    const result = await listWarehouseInboundRows({
      coupangSellerAccountId: sellerId,
    });

    const buffer = generateWarehouseInboundListBuffer(result.rows);
    const filename = buildWarehouseInboundListFilename(seller.displayName);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encodeContentDispositionFilename(filename),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/downloads/warehouse-inbound-list",
      method: "GET",
    });
    return jsonError("입고리스트 생성에 실패했습니다.", 500);
  }
}

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import {
  buildWarehouseInboundListFilename,
  generateWarehouseInboundListBuffer,
} from "@/lib/excel/generators/warehouse-inbound-list";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";
import { loadOutboundDecomposeContext } from "@/services/deliverables/load-outbound-decompose-context";
import { loadShoplingInboundRotationBatches } from "@/services/deliverables/load-shopling-inbound-rotation-batches";
import { listWarehouseInboundRows } from "@/services/deliverables/list-warehouse-inbound-rows";

function parseWarehouseInboundRotation(
  value: string | null | undefined,
): 0 | 1 | 2 | 3 {
  if (value === "1") {
    return 1;
  }

  if (value === "2") {
    return 2;
  }

  if (value === "3") {
    return 3;
  }

  return 0;
}

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

    const searchParams = new URL(request.url).searchParams;
    const sellerId = searchParams.get("seller")?.trim();
    const rotation = parseWarehouseInboundRotation(searchParams.get("rotation"));

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

    const [rotationBatches, decomposeContext] =
      rotation > 0
        ? await Promise.all([
            loadShoplingInboundRotationBatches(rotation),
            loadOutboundDecomposeContext(),
          ])
        : [[], null];

    const buffer = generateWarehouseInboundListBuffer(result.rows, {
      rotationCount: rotation,
      rotationBatches,
      packageMappingsByBarcode:
        decomposeContext?.packageMappingsByBarcode ?? new Map(),
    });
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

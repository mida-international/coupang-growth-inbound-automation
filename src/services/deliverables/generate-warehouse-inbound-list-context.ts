import { resolveActiveSellerAccount } from "@/lib/api/download-helpers";
import {
  buildWarehouseInboundListFilename,
  generateWarehouseInboundListBuffer,
} from "@/lib/excel/generators/warehouse-inbound-list";
import { loadOutboundDecomposeContext } from "@/services/deliverables/load-outbound-decompose-context";
import { loadShoplingInboundRotationBatches } from "@/services/deliverables/load-shopling-inbound-rotation-batches";
import { listWarehouseInboundRows } from "@/services/deliverables/list-warehouse-inbound-rows";
import type { ListWarehouseInboundRowsResult } from "@/services/deliverables/types";

export function parseWarehouseInboundRotation(
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

export type WarehouseInboundListContext = {
  seller: {
    id: string;
    displayName: string;
  };
  listResult: ListWarehouseInboundRowsResult;
  rotation: 0 | 1 | 2 | 3;
  buffer: Buffer;
  outputFileName: string;
};

export async function generateWarehouseInboundListContext(
  sellerId: string,
  rotation: 0 | 1 | 2 | 3,
): Promise<WarehouseInboundListContext> {
  const seller = await resolveActiveSellerAccount(sellerId);

  if (!seller) {
    throw new Error("유효한 판매자 계정이 아닙니다.");
  }

  const listResult = await listWarehouseInboundRows({
    coupangSellerAccountId: sellerId,
  });

  const [rotationBatches, decomposeContext] =
    rotation > 0
      ? await Promise.all([
          loadShoplingInboundRotationBatches(rotation),
          loadOutboundDecomposeContext(),
        ])
      : [[], null];

  const buffer = generateWarehouseInboundListBuffer(listResult.rows, {
    rotationCount: rotation,
    rotationBatches,
    packageMappingsByBarcode:
      decomposeContext?.packageMappingsByBarcode ?? new Map(),
  });
  const outputFileName = buildWarehouseInboundListFilename(seller.displayName);

  return {
    seller: {
      id: seller.id,
      displayName: seller.displayName,
    },
    listResult,
    rotation,
    buffer,
    outputFileName,
  };
}

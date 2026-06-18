import { resolveActiveSellerAccount } from "@/lib/api/download-helpers";
import {
  buildWarehouseInboundListFilename,
  buildWarehouseInboundListGrid,
  generateWarehouseInboundListBuffer,
  type WarehouseInboundListGrid,
} from "@/lib/excel/generators/warehouse-inbound-list";
import { loadCenterSeparationBarcodeSet } from "@/services/deliverables/load-center-separation-barcode-set";
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
  grid: WarehouseInboundListGrid;
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

  const [listResult, centerSeparationBarcodes] = await Promise.all([
    listWarehouseInboundRows({
      coupangSellerAccountId: sellerId,
    }),
    loadCenterSeparationBarcodeSet(),
  ]);

  const [rotationBatches, decomposeContext] =
    rotation > 0
      ? await Promise.all([
          loadShoplingInboundRotationBatches(rotation),
          loadOutboundDecomposeContext(),
        ])
      : [[], null];

  const listOptions = {
    rotationCount: rotation,
    rotationBatches,
    packageMappingsByBarcode:
      decomposeContext?.packageMappingsByBarcode ?? new Map(),
    centerSeparationBarcodes,
  } as const;

  const grid = buildWarehouseInboundListGrid(listResult.rows, listOptions);
  const buffer = generateWarehouseInboundListBuffer(listResult.rows, listOptions);
  const outputFileName = buildWarehouseInboundListFilename(seller.displayName);

  return {
    seller: {
      id: seller.id,
      displayName: seller.displayName,
    },
    listResult,
    rotation,
    grid,
    buffer,
    outputFileName,
  };
}

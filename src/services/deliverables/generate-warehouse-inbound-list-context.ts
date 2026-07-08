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
import {
  listWarehouseInboundRows,
  listWarehouseInboundRowsIgnoringShoplingStock,
} from "@/services/deliverables/list-warehouse-inbound-rows";
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

export type GenerateWarehouseInboundListContextOptions = {
  /** 샵플링 재고 상한을 무시한 추천 수량으로 생성 (기존 다운로드와 별개 추가 기능) */
  ignoreShoplingStock?: boolean;
};

export async function generateWarehouseInboundListContext(
  sellerId: string,
  rotation: 0 | 1 | 2 | 3,
  options?: GenerateWarehouseInboundListContextOptions,
): Promise<WarehouseInboundListContext> {
  const seller = await resolveActiveSellerAccount(sellerId);

  if (!seller) {
    throw new Error("유효한 판매자 계정이 아닙니다.");
  }

  const ignoreShoplingStock = options?.ignoreShoplingStock ?? false;

  const [listResult, centerSeparationBarcodes] = await Promise.all([
    ignoreShoplingStock
      ? listWarehouseInboundRowsIgnoringShoplingStock({
          coupangSellerAccountId: sellerId,
        })
      : listWarehouseInboundRows({
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
  const outputFileName = buildWarehouseInboundListFilename(
    seller.displayName,
    undefined,
    ignoreShoplingStock ? "샵플링미고려" : undefined,
  );

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

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
  listWarehouseInboundRowsShoplingZeroShortage,
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
  /**
   * 입고 필요량은 있으나 샵플링 재고가 0이라 표준 리스트에서 빠진 상품만 뽑는다
   * (기존 표준 다운로드와 별개의 추가 목록).
   */
  shoplingZeroShortageOnly?: boolean;
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

  const shoplingZeroShortageOnly = options?.shoplingZeroShortageOnly ?? false;

  const [listResult, centerSeparationBarcodes] = await Promise.all([
    shoplingZeroShortageOnly
      ? listWarehouseInboundRowsShoplingZeroShortage({
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
    shoplingZeroShortageOnly ? "샵플링재고0누락분" : undefined,
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

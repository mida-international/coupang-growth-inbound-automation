import type { ShoplingPackageMappingRowView } from "@/services/shopling-package-mapping/types";

type PackageMappingDbRow = {
  id: string;
  packageBarcode: string | null;
  packageGoodsKey: string;
  packageOptId: string;
  packagePtnGoodsCd: string | null;
  packageOptValue: string | null;
  singleBarcode: string | null;
  singleGoodsKey: string | null;
  singleOptId: string;
  singleOptValue: string | null;
  singlePtnGoodsCd: string | null;
  mapCnt: number;
  manuallyEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function mapShoplingPackageMappingRow(
  row: PackageMappingDbRow,
): ShoplingPackageMappingRowView {
  return {
    id: row.id,
    packageBarcode: row.packageBarcode,
    packageGoodsKey: row.packageGoodsKey,
    packageOptId: row.packageOptId,
    packagePtnGoodsCd: row.packagePtnGoodsCd,
    packageOptValue: row.packageOptValue,
    singleBarcode: row.singleBarcode,
    singleGoodsKey: row.singleGoodsKey,
    singleOptId: row.singleOptId,
    singleOptValue: row.singleOptValue,
    singlePtnGoodsCd: row.singlePtnGoodsCd,
    mapCnt: row.mapCnt,
    manuallyEdited: row.manuallyEdited,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const shoplingPackageMappingRowSelect = {
  id: true,
  packageBarcode: true,
  packageGoodsKey: true,
  packageOptId: true,
  packagePtnGoodsCd: true,
  packageOptValue: true,
  singleBarcode: true,
  singleGoodsKey: true,
  singleOptId: true,
  singleOptValue: true,
  singlePtnGoodsCd: true,
  mapCnt: true,
  manuallyEdited: true,
  createdAt: true,
  updatedAt: true,
} as const;

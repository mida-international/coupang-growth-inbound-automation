import "server-only";

import { getKstTodayDate } from "@/lib/date/kst-today";
import { prisma } from "@/lib/db";
import { buildShoplingRequestXml } from "@/lib/shopling/build-request-xml";
import {
  SHOPLING_PROD_FIELDS_SYNC,
  SHOPLING_PROD_GATHER_URL,
  SHOPLING_SYNC_VERIFY_END_YMD,
  SHOPLING_SYNC_VERIFY_START_YMD,
} from "@/lib/shopling/constants";
import { formatYyyyMmDd } from "@/lib/shopling/format-yyyymmdd";
import { postShoplingApi } from "@/lib/shopling/post-shopling-api";
import {
  countGoodsInfoBlocks,
  parseShoplingProductsFromXml,
} from "@/lib/shopling/parse-product-rows";
import { extractShoplingApiError } from "@/lib/shopling/parse-response-xml";
import { SHOPLING_INVENTORY_TABLE } from "@/lib/shopling/target";
import { getShoplingApiConfigSecret } from "@/services/shopling-api-config/get-shopling-api-config-secret";
import type {
  ShoplingSyncRunResult,
  ShoplingSyncServiceResult,
} from "@/services/shopling-sync/types";

const CREATE_MANY_BATCH_SIZE = 1000;

type SyncShoplingInventoryInput = {
  uploadedById: string;
};

export async function syncShoplingInventory(
  input: SyncShoplingInventoryInput,
): Promise<ShoplingSyncServiceResult<ShoplingSyncRunResult>> {
  const configResult = await getShoplingApiConfigSecret();

  if (!configResult.ok) {
    return configResult;
  }

  const startDt = SHOPLING_SYNC_VERIFY_START_YMD;
  const endDt = SHOPLING_SYNC_VERIFY_END_YMD;

  const requestXml = buildShoplingRequestXml({
    loginId: configResult.data.loginId,
    companyId: configResult.data.companyId,
    apiAuthKey: configResult.data.apiAuthKey,
    startDt,
    endDt,
    prodFields: SHOPLING_PROD_FIELDS_SYNC,
  });

  let responseBody: string;
  let httpStatus: number;

  try {
    const response = await postShoplingApi(
      SHOPLING_PROD_GATHER_URL,
      requestXml,
    );
    httpStatus = response.status;
    responseBody = response.body;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "샵플링 API 호출에 실패했습니다.";

    return { ok: false, error: message };
  }

  if (httpStatus < 200 || httpStatus >= 300) {
    const apiError = extractShoplingApiError(responseBody);

    return {
      ok: false,
      error:
        apiError ??
        `샵플링 API 요청에 실패했습니다. (HTTP ${httpStatus})`,
    };
  }

  const apiError = extractShoplingApiError(responseBody);

  if (apiError) {
    return { ok: false, error: apiError };
  }

  const parsedRows = parseShoplingProductsFromXml(responseBody);
  const fetchedProductCount = countGoodsInfoBlocks(responseBody);
  const snapshotDate = getKstTodayDate();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.shoplingInventory.deleteMany({
        where: { snapshotDate },
      });

      const ingestionLog = await tx.ingestionLog.create({
        data: {
          tableName: SHOPLING_INVENTORY_TABLE,
          snapshotDate,
          operation: "reload",
          rowCount: parsedRows.length,
          uploadedById: input.uploadedById,
          sourceFile: "shopling-api-sync-verify",
        },
      });

      for (let offset = 0; offset < parsedRows.length; offset += CREATE_MANY_BATCH_SIZE) {
        const batch = parsedRows.slice(offset, offset + CREATE_MANY_BATCH_SIZE);

        await tx.shoplingInventory.createMany({
          data: batch.map((row) => ({
            ingestionId: ingestionLog.id,
            goodsKey: row.goodsKey,
            ptnGoodsCd: row.ptnGoodsCd,
            productName: row.productName,
            saleStatus: row.saleStatus,
            goodsTp: row.goodsTp,
            barcode: row.barcode,
            optId: row.optId,
            optionTitle: row.optionTitle,
            optionValue: row.optionValue,
            availableStock: row.availableStock,
            realStock: row.realStock,
            optVrtlQty: row.optVrtlQty,
            optPrice: row.optPrice,
            optSupplyPrice: row.optSupplyPrice,
            optStatus: row.optStatus,
            location: row.location,
            snapshotDate,
          })),
        });
      }
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "샵플링 재고 데이터 적재에 실패했습니다.";

    return { ok: false, error: message };
  }

  return {
    ok: true,
    data: {
      snapshotDate: formatYyyyMmDd(snapshotDate),
      startDt,
      endDt,
      fetchedProductCount,
      rowCount: parsedRows.length,
    },
  };
}

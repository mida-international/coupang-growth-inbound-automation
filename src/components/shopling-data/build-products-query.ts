import { buildShoplingListQuery } from "@/components/shopling-data/build-shopling-list-query";
import { SHOPLING_INVENTORY_DEFAULT_PAGE_SIZE } from "@/services/shopling-data/types";

type BuildProductsQueryOptions = {
  q?: string;
  page?: number;
  pageSize?: number;
};

/** @deprecated Use buildShoplingListQuery */
export function buildProductsQuery(
  options: BuildProductsQueryOptions,
): string {
  return buildShoplingListQuery({
    ...options,
    defaultPageSize: SHOPLING_INVENTORY_DEFAULT_PAGE_SIZE,
  });
}

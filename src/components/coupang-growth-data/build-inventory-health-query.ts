import { INVENTORY_HEALTH_DEFAULT_PAGE_SIZE } from "@/services/coupang-growth-data/types";

type BuildInventoryHealthQueryOptions = {
  seller?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export function buildInventoryHealthQuery({
  seller,
  q,
  page,
  pageSize,
}: BuildInventoryHealthQueryOptions): string {
  const params = new URLSearchParams();

  if (seller) {
    params.set("seller", seller);
  }

  const trimmed = q?.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }

  if (page !== undefined && page > 1) {
    params.set("page", String(page));
  }

  if (
    pageSize !== undefined &&
    pageSize !== INVENTORY_HEALTH_DEFAULT_PAGE_SIZE
  ) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

type BuildShoplingListQueryOptions = {
  q?: string;
  page?: number;
  pageSize?: number;
  defaultPageSize?: number;
};

export function buildShoplingListQuery({
  q,
  page,
  pageSize,
  defaultPageSize = 50,
}: BuildShoplingListQueryOptions): string {
  const params = new URLSearchParams();

  const trimmed = q?.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }

  if (page !== undefined && page > 1) {
    params.set("page", String(page));
  }

  if (pageSize !== undefined && pageSize !== defaultPageSize) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

type BuildProductsQueryOptions = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export function buildProductsQuery({
  q,
  page,
  pageSize,
}: BuildProductsQueryOptions): string {
  const params = new URLSearchParams();

  const trimmed = q?.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }

  if (page !== undefined && page > 1) {
    params.set("page", String(page));
  }

  if (pageSize !== undefined && pageSize !== 50) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

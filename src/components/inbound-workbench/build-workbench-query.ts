type BuildWorkbenchQueryOptions = {
  seller?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export function buildWorkbenchQuery({
  seller,
  q,
  page,
  pageSize,
}: BuildWorkbenchQueryOptions): string {
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

  if (pageSize !== undefined && pageSize !== 50) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

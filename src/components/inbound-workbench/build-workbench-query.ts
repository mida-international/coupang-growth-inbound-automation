type BuildWorkbenchQueryOptions = {
  seller?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string | null;
  dir?: string | null;
};

export function buildWorkbenchQuery({
  seller,
  q,
  page,
  pageSize,
  sort,
  dir,
}: BuildWorkbenchQueryOptions): string {
  const params = new URLSearchParams();

  if (seller) {
    params.set("seller", seller);
  }

  const trimmed = q?.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }

  if (sort) {
    params.set("sort", sort);
  }

  if (dir) {
    params.set("dir", dir);
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

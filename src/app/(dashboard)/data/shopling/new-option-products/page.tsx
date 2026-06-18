import { ShoplingNewOptionProductsPanel } from "@/components/shopling-data/shopling-new-option-products-panel";
import { requireProfile } from "@/lib/auth/profile";
import { listNewOptionProducts } from "@/services/shopling-data/list-new-option-products";
import { normalizeShoplingInventoryPageSize } from "@/services/shopling-data/types";

type ShoplingNewOptionProductsPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    days?: string;
    page?: string;
    q?: string;
    pageSize?: string;
  }>;
};

export default async function ShoplingNewOptionProductsPage({
  searchParams,
}: ShoplingNewOptionProductsPageProps) {
  await requireProfile();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const pageSize = normalizeShoplingInventoryPageSize(Number(params.pageSize));
  const page = Math.max(1, Number(params.page) || 1);
  const daysParam = params.days?.trim();
  const usePreset = Boolean(daysParam);

  const data = await listNewOptionProducts({
    from: usePreset ? undefined : params.from,
    to: usePreset ? undefined : params.to,
    days: usePreset ? daysParam : undefined,
    page,
    pageSize,
    search,
  });

  return (
    <div className="flex min-w-0 flex-col">
      <ShoplingNewOptionProductsPanel
      data={data}
      search={search}
      page={page}
      pageSize={pageSize}
    />
    </div>
  );
}

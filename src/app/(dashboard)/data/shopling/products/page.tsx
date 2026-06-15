import { ShoplingProductsPanel } from "@/components/shopling-data/shopling-products-panel";
import { requireProfile } from "@/lib/auth/profile";
import { listShoplingInventory } from "@/services/shopling-data/list-shopling-inventory";
import { normalizeShoplingInventoryPageSize } from "@/services/shopling-data/types";

type ShoplingProductsPageProps = {
  searchParams: Promise<{ page?: string; q?: string; pageSize?: string }>;
};

export default async function ShoplingProductsPage({
  searchParams,
}: ShoplingProductsPageProps) {
  await requireProfile();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const pageSize = normalizeShoplingInventoryPageSize(Number(params.pageSize));
  const page = Math.max(1, Number(params.page) || 1);
  const data = await listShoplingInventory({ page, pageSize, search });

  return (
    <ShoplingProductsPanel
      data={data}
      search={search}
      page={page}
      pageSize={pageSize}
    />
  );
}

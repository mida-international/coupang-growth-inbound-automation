import { ShoplingPackageMappingPanel } from "@/components/shopling-data/shopling-package-mapping-panel";
import { requireProfile } from "@/lib/auth/profile";
import { listShoplingPackageMapping } from "@/services/shopling-package-mapping/list-shopling-package-mapping";
import { normalizeShoplingPackageMappingPageSize } from "@/services/shopling-package-mapping/types";

type ShoplingPackageMappingPageProps = {
  searchParams: Promise<{ page?: string; q?: string; pageSize?: string }>;
};

export default async function ShoplingPackageMappingPage({
  searchParams,
}: ShoplingPackageMappingPageProps) {
  await requireProfile();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const pageSize = normalizeShoplingPackageMappingPageSize(
    Number(params.pageSize),
  );
  const page = Math.max(1, Number(params.page) || 1);
  const data = await listShoplingPackageMapping({ page, pageSize, search });

  return (
    <ShoplingPackageMappingPanel
      data={data}
      search={search}
      page={page}
      pageSize={pageSize}
    />
  );
}

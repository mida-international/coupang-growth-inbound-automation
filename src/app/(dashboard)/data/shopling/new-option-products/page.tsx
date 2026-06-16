import { ShoplingNewOptionProductsPanel } from "@/components/shopling-data/shopling-new-option-products-panel";
import { requireProfile } from "@/lib/auth/profile";

export default async function ShoplingNewOptionProductsPage() {
  await requireProfile();

  return <ShoplingNewOptionProductsPanel />;
}

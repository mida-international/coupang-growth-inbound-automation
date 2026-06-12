import { SellerAccountsPanel } from "@/components/coupang-seller-accounts/seller-accounts-panel";
import { requireProfile } from "@/lib/auth/profile";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";

export default async function SellerAccountsPage() {
  await requireProfile();

  const accounts = await listSellerAccounts();

  return <SellerAccountsPanel accounts={accounts} />;
}

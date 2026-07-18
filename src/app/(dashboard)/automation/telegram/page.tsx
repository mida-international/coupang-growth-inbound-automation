import { TelegramBoxListSection } from "@/components/automation/telegram-box-list-section";
import { requireProfile } from "@/lib/auth/profile";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";

export default async function TelegramAutomationPage() {
  await requireProfile();

  const accounts = await listSellerAccounts();

  return <TelegramBoxListSection accounts={accounts} />;
}

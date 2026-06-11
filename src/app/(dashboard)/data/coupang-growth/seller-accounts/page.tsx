import { AddSellerAccountForm } from "@/components/coupang-seller-accounts/add-seller-account-form";
import { SellerAccountsTable } from "@/components/coupang-seller-accounts/seller-accounts-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireProfile } from "@/lib/auth/profile";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";

export default async function SellerAccountsPage() {
  await requireProfile();

  const accounts = await listSellerAccounts();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          쿠팡 판매자 계정 관리
        </h1>
        <p className="text-muted-foreground">
          쿠팡 Wing 판매자 계정을 등록하고 관리합니다.
        </p>
      </div>

      <AddSellerAccountForm />

      <Card>
        <CardHeader>
          <CardTitle>판매자 계정 목록</CardTitle>
          <CardDescription>등록된 모든 판매자 계정입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <SellerAccountsTable accounts={accounts} />
        </CardContent>
      </Card>
    </div>
  );
}
